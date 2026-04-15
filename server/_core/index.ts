import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerGoogleAuthRoutes } from "../googleAuth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import Stripe from "stripe";
import * as db from "../db";

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // ─── Stripe Webhook (MUST be before express.json) ───────────────────────────
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
    const stripeKey = process.env.STRIPE_SECRET_KEY || "";
    if (!stripeKey) { res.status(400).send("Stripe not configured"); return; }

    const stripe = new Stripe(stripeKey);
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
    } catch (err) {
      console.error("[Stripe Webhook] Signature verification failed:", err);
      res.status(400).send("Webhook signature verification failed");
      return;
    }

    // Test event passthrough
    if (event.id.startsWith("evt_test_")) {
      console.log("[Webhook] Test event detected, returning verification response");
      res.json({ verified: true });
      return;
    }

    console.log(`[Stripe Webhook] Event: ${event.type} (${event.id})`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id ? parseInt(session.metadata.user_id) : null;
      const planSlug = session.metadata?.plan_slug as string | undefined;
      const billingCycle = session.metadata?.billing_cycle as "monthly" | "annual" | undefined;

      if (userId && planSlug && billingCycle) {
        const plans = await db.getSubscriptionPlans();
        const plan = plans.find((p) => p.slug === planSlug);
        if (plan) {
          const now = new Date();
          const periodEnd = new Date(now);
          periodEnd.setMonth(periodEnd.getMonth() + (billingCycle === "annual" ? 12 : 1));
          await db.upsertUserSubscription({
            userId,
            planId: plan.id,
            status: "active",
            billingCycle,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            stripeCustomerId: session.customer as string | undefined,
            stripeSubscriptionId: session.subscription as string | undefined,
          });
          console.log(`[Stripe Webhook] Subscription activated for user ${userId}, plan ${planSlug}`);
        }
      }
    }

    if (event.type === "customer.subscription.deleted" || event.type === "customer.subscription.updated") {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      if (customerId) {
        await db.cancelSubscriptionByStripeCustomer(customerId);
        console.log(`[Stripe Webhook] Subscription updated/cancelled for customer ${customerId}`);
      }
    }

    res.json({ received: true });
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Google OAuth routes: /api/oauth/google and /api/oauth/google/callback
  registerGoogleAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
