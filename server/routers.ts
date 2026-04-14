import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import Stripe from "stripe";
import { STRIPE_PRODUCTS } from "./stripeProducts";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function adminProcedure() {
  return protectedProcedure.use(({ ctx, next }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    return next({ ctx });
  });
}

// ─── Scanning Engine ─────────────────────────────────────────────────────────
async function simulateScan(profileId: number, scanType: "initial" | "weekly" | "manual") {
  const brokers = await db.getAllBrokers();
  const profile = await db.getProfileById(profileId, -1); // admin context
  if (!brokers.length) return { scanned: 0, found: 0 };

  let found = 0;
  // Simulate scan: critical brokers have higher chance of finding data
  for (const broker of brokers) {
    const chance = broker.priorityTier === "critical" ? 0.7 : broker.priorityTier === "high" ? 0.5 : 0.3;
    const isPresent = Math.random() < chance;
    if (isPresent) {
      found++;
      await db.upsertScanResult({
        profileId,
        brokerId: broker.id,
        foundUrl: `${broker.searchUrl || `https://${broker.domain}`}`,
        dataTypesFound: (broker.dataTypes as string[] | null) ?? ["name", "address"],
        isPresent: true,
        scanType,
      });
      // Auto-create removal request
      await db.createRemovalRequest({
        profileId,
        brokerId: broker.id,
        submissionMethod: broker.removalMethod === "form" ? "automated" : broker.removalMethod === "email" ? "email" : "manual",
      });
    }
  }
  return { scanned: brokers.length, found };
}

// ─── HIBP Integration ─────────────────────────────────────────────────────────
async function checkHIBP(email: string) {
  try {
    const res = await fetch(
      `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`,
      {
        headers: {
          "hibp-api-key": process.env.HIBP_API_KEY || "",
          "user-agent": "PrivacyShield-App",
        },
      }
    );
    if (res.status === 404) return [];
    if (res.status === 401) return []; // No API key configured
    if (!res.ok) return [];
    return await res.json() as Array<{
      Name: string; Domain: string; BreachDate: string;
      DataClasses: string[]; Description: string; IsVerified: boolean; IsSensitive: boolean;
    }>;
  } catch {
    return [];
  }
}

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Subscriptions ──────────────────────────────────────────────────────────
  subscription: router({
    plans: publicProcedure.query(async () => {
      return db.getSubscriptionPlans();
    }),

    mySubscription: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserSubscription(ctx.user.id);
    }),

    // Create Stripe Checkout Session for subscription
    createCheckout: protectedProcedure
      .input(z.object({
        planSlug: z.enum(["individual", "family", "organization"]),
        billingCycle: z.enum(["monthly", "annual"]),
        origin: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe not configured" });

        const stripe = new Stripe(stripeKey);
        const product = STRIPE_PRODUCTS[input.planSlug][input.billingCycle];

        // Create price on the fly (or use pre-created price IDs in production)
        const price = await stripe.prices.create({
          unit_amount: product.amount,
          currency: product.currency,
          recurring: { interval: product.interval },
          product_data: { name: product.name },
        });

        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          line_items: [{ price: price.id, quantity: 1 }],
          customer_email: ctx.user.email ?? undefined,
          client_reference_id: ctx.user.id.toString(),
          allow_promotion_codes: true,
          metadata: {
            user_id: ctx.user.id.toString(),
            plan_slug: input.planSlug,
            billing_cycle: input.billingCycle,
            customer_email: ctx.user.email ?? "",
            customer_name: ctx.user.name ?? "",
          },
          success_url: `${input.origin}/subscription?success=1`,
          cancel_url: `${input.origin}/subscription?cancelled=1`,
        });

        return { url: session.url };
      }),

    // Simulate subscription activation (fallback when Stripe not configured)
    activate: protectedProcedure
      .input(z.object({
        planSlug: z.enum(["individual", "family", "organization"]),
        billingCycle: z.enum(["monthly", "annual"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const plans = await db.getSubscriptionPlans();
        const plan = plans.find((p) => p.slug === input.planSlug);
        if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });

        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + (input.billingCycle === "annual" ? 12 : 1));

        await db.upsertUserSubscription({
          userId: ctx.user.id,
          planId: plan.id,
          status: "active",
          billingCycle: input.billingCycle,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        });
        return { success: true };
      }),
  }),

  // ─── Identity Profiles ───────────────────────────────────────────────────────
  profile: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getProfilesByUserId(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const profile = await db.getProfileById(input.id, ctx.user.id);
        if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
        return profile;
      }),

    create: protectedProcedure
      .input(z.object({
        fullName: z.string().min(2),
        aliases: z.array(z.string()).optional(),
        addresses: z.array(z.object({
          street: z.string(),
          city: z.string(),
          state: z.string(),
          zip: z.string(),
          isCurrent: z.boolean(),
        })).optional(),
        phoneNumbers: z.array(z.string()).optional(),
        emailAddresses: z.array(z.string().email()).optional(),
        dateOfBirth: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createProfile({ ...input, userId: ctx.user.id });
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        fullName: z.string().min(2).optional(),
        aliases: z.array(z.string()).optional(),
        addresses: z.array(z.object({
          street: z.string(),
          city: z.string(),
          state: z.string(),
          zip: z.string(),
          isCurrent: z.boolean(),
        })).optional(),
        phoneNumbers: z.array(z.string()).optional(),
        emailAddresses: z.array(z.string().email()).optional(),
        dateOfBirth: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateProfile(id, ctx.user.id, data);
        return { success: true };
      }),
  }),

  // ─── Data Brokers ────────────────────────────────────────────────────────────
  broker: router({
    list: publicProcedure
      .input(z.object({ tier: z.enum(["critical", "high", "standard"]).optional() }))
      .query(async ({ input }) => {
        return db.getAllBrokers(input.tier);
      }),

    count: publicProcedure.query(async () => {
      return db.getBrokerCount();
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const broker = await db.getBrokerById(input.id);
        if (!broker) throw new TRPCError({ code: "NOT_FOUND" });
        return broker;
      }),
  }),

  // ─── Scanning ────────────────────────────────────────────────────────────────
  scan: router({
    results: protectedProcedure
      .input(z.object({ profileId: z.number() }))
      .query(async ({ ctx, input }) => {
        const profile = await db.getProfileById(input.profileId, ctx.user.id);
        if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
        return db.getScanResultsByProfile(input.profileId);
      }),

    run: protectedProcedure
      .input(z.object({
        profileId: z.number(),
        scanType: z.enum(["initial", "weekly", "manual"]).default("manual"),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getProfileById(input.profileId, ctx.user.id);
        if (!profile) throw new TRPCError({ code: "NOT_FOUND" });

        // Create monitoring job
        await db.createMonitoringJob({ profileId: input.profileId, jobType: "manual" });

        // Run scan
        const result = await simulateScan(input.profileId, input.scanType);
        return result;
      }),

    privacyScore: protectedProcedure
      .input(z.object({ profileId: z.number() }))
      .query(async ({ ctx, input }) => {
        const profile = await db.getProfileById(input.profileId, ctx.user.id);
        if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
        const score = await db.calculatePrivacyScore(input.profileId);
        const stats = await db.getRemovalStats(input.profileId);
        const activeFindings = await db.getActiveScanCount(input.profileId);
        const totalBrokers = await db.getBrokerCount();
        return { score, stats, activeFindings, totalBrokers };
      }),
  }),

  // ─── Removal Requests ────────────────────────────────────────────────────────
  removal: router({
    list: protectedProcedure
      .input(z.object({ profileId: z.number() }))
      .query(async ({ ctx, input }) => {
        const profile = await db.getProfileById(input.profileId, ctx.user.id);
        if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
        return db.getRemovalRequestsByProfile(input.profileId);
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["Pending", "Submitted", "Confirmed", "Re-appeared"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateRemovalStatus(input.id, input.status, input.notes);
        return { success: true };
      }),

    stats: protectedProcedure
      .input(z.object({ profileId: z.number() }))
      .query(async ({ ctx, input }) => {
        const profile = await db.getProfileById(input.profileId, ctx.user.id);
        if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
        return db.getRemovalStats(input.profileId);
      }),
  }),

  // ─── Breach Alerts ───────────────────────────────────────────────────────────
  breach: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getBreachAlertsByUser(ctx.user.id);
    }),

    check: protectedProcedure
      .input(z.object({
        email: z.string().email(),
        profileId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const breaches = await checkHIBP(input.email);

        for (const breach of breaches) {
          await db.createBreachAlert({
            userId: ctx.user.id,
            profileId: input.profileId,
            email: input.email,
            breachName: breach.Name,
            breachDomain: breach.Domain,
            breachDate: breach.BreachDate,
            dataClasses: breach.DataClasses,
            description: breach.Description,
            isVerified: breach.IsVerified,
            isSensitive: breach.IsSensitive,
            source: "hibp",
          });
        }

        // If no HIBP key, return demo data
        if (breaches.length === 0 && !process.env.HIBP_API_KEY) {
          return { found: 0, message: "HIBP API key not configured. Add HIBP_API_KEY to enable live breach checking." };
        }

        return { found: breaches.length };
      }),

    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.markBreachAlertRead(input.id, ctx.user.id);
        return { success: true };
      }),

    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return db.getUnreadBreachCount(ctx.user.id);
    }),
  }),

  // ─── Monitoring ──────────────────────────────────────────────────────────────
  monitoring: router({
    jobs: protectedProcedure
      .input(z.object({ profileId: z.number() }))
      .query(async ({ ctx, input }) => {
        const profile = await db.getProfileById(input.profileId, ctx.user.id);
        if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
        return db.getMonitoringJobsByProfile(input.profileId);
      }),

    runWeeklyScan: protectedProcedure
      .input(z.object({ profileId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getProfileById(input.profileId, ctx.user.id);
        if (!profile) throw new TRPCError({ code: "NOT_FOUND" });

        const job = await db.createMonitoringJob({ profileId: input.profileId, jobType: "weekly_scan" });
        const result = await simulateScan(input.profileId, "weekly");
        return { ...result, jobCreated: true };
      }),
  }),

  // ─── Deindex Requests ────────────────────────────────────────────────────────
  deindex: router({
    list: protectedProcedure
      .input(z.object({ profileId: z.number() }))
      .query(async ({ ctx, input }) => {
        const profile = await db.getProfileById(input.profileId, ctx.user.id);
        if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
        return db.getDeindexRequestsByProfile(input.profileId);
      }),

    create: protectedProcedure
      .input(z.object({
        profileId: z.number(),
        engine: z.enum(["google", "bing"]),
        targetUrl: z.string().url(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getProfileById(input.profileId, ctx.user.id);
        if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
        await db.createDeindexRequest(input);
        return { success: true };
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["Pending", "Submitted", "Confirmed", "Rejected"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateDeindexStatus(input.id, input.status);
        return { success: true };
      }),
  }),

  // ─── LLM Assistance ──────────────────────────────────────────────────────────
  llm: router({
    generate: protectedProcedure
      .input(z.object({
        requestType: z.enum(["opt_out_email", "gdpr_ccpa_letter", "manual_guidance"]),
        brokerId: z.number().optional(),
        profileId: z.number().optional(),
        profileName: z.string().optional(),
        profileEmail: z.string().optional(),
        profileAddress: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        let broker = null;
        if (input.brokerId) {
          broker = await db.getBrokerById(input.brokerId);
        }

        const brokerInfo = broker
          ? `Data broker: ${broker.name} (${broker.domain}). Removal method: ${broker.removalMethod}. Opt-out URL: ${broker.optOutUrl || "N/A"}. Difficulty: ${broker.difficultyRating}. Notes: ${broker.notes || "None"}.`
          : "General data broker removal request.";

        const userInfo = [
          input.profileName && `Full name: ${input.profileName}`,
          input.profileEmail && `Email: ${input.profileEmail}`,
          input.profileAddress && `Address: ${input.profileAddress}`,
        ].filter(Boolean).join(". ");

        let systemPrompt = "";
        let userPrompt = "";

        if (input.requestType === "opt_out_email") {
          systemPrompt = "You are a privacy rights expert. Write professional, concise opt-out email templates for data broker removal requests. Include subject line, body, and closing. Be firm but polite.";
          userPrompt = `Write an opt-out email for the following:\n${brokerInfo}\nUser info: ${userInfo || "Not provided"}.\nInclude: Subject line, greeting, clear removal request citing CCPA/applicable law, personal details placeholder [YOUR_INFO], and professional closing.`;
        } else if (input.requestType === "gdpr_ccpa_letter") {
          systemPrompt = "You are a data privacy attorney. Draft formal GDPR/CCPA data deletion request letters. Include all legally required elements, cite specific legal provisions, and use formal language.";
          userPrompt = `Draft a formal GDPR/CCPA data deletion letter for:\n${brokerInfo}\nUser info: ${userInfo || "Not provided"}.\nInclude: Date, formal address, citation of CCPA Section 1798.105 and/or GDPR Article 17, specific data deletion request, 30-day response deadline, and signature block.`;
        } else {
          systemPrompt = "You are a privacy removal expert. Provide clear, step-by-step manual removal guidance for data broker sites. Be specific and actionable.";
          userPrompt = `Provide step-by-step manual removal guidance for:\n${brokerInfo}\nUser info: ${userInfo || "Not provided"}.\nInclude: Exact steps to find the listing, how to submit the removal request, what information is needed, expected timeline, and follow-up steps if not removed.`;
        }

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });

        const rawContent = response.choices[0]?.message?.content;
        const content = typeof rawContent === "string" ? rawContent : "Unable to generate content.";

        await db.saveLlmRequest({
          userId: ctx.user.id,
          profileId: input.profileId,
          brokerId: input.brokerId,
          requestType: input.requestType,
          generatedContent: content,
        });

        return { content };
      }),

    history: protectedProcedure.query(async ({ ctx }) => {
      return db.getLlmHistory(ctx.user.id);
    }),
  }),

  // ─── Admin ───────────────────────────────────────────────────────────────────
  admin: router({
    users: adminProcedure()
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        const [users, total] = await Promise.all([
          db.getAllUsers(input.limit, input.offset),
          db.getTotalUserCount(),
        ]);
        return { users, total };
      }),

    brokers: adminProcedure()
      .input(z.object({ tier: z.enum(["critical", "high", "standard"]).optional() }))
      .query(async ({ input }) => {
        return db.getAllBrokers(input.tier);
      }),

    updateBroker: adminProcedure()
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        optOutUrl: z.string().optional(),
        priorityTier: z.enum(["critical", "high", "standard"]).optional(),
        difficultyRating: z.enum(["easy", "medium", "hard"]).optional(),
        isActive: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateBroker(id, data);
        return { success: true };
      }),

    stats: adminProcedure().query(async () => {
      const [totalUsers, totalBrokers] = await Promise.all([
        db.getTotalUserCount(),
        db.getBrokerCount(),
      ]);
      return { totalUsers, totalBrokers };
    }),
  }),
});

export type AppRouter = typeof appRouter;
