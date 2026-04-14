import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB ─────────────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getSubscriptionPlans: vi.fn().mockResolvedValue([
    { id: 1, name: "Individual", slug: "individual", maxMembers: 1, priceMonthly: "9.99", priceAnnual: "99.99", features: ["148+ broker scans", "Weekly monitoring", "Breach alerts"] },
    { id: 2, name: "Family", slug: "family", maxMembers: 5, priceMonthly: "19.99", priceAnnual: "199.99", features: ["All Individual features", "Up to 5 members"] },
    { id: 3, name: "Organization", slug: "organization", maxMembers: 25, priceMonthly: "49.99", priceAnnual: "499.99", features: ["All Family features", "Up to 25 members"] },
  ]),
  getUserSubscription: vi.fn().mockResolvedValue(null),
  upsertUserSubscription: vi.fn().mockResolvedValue(undefined),
  getProfilesByUserId: vi.fn().mockResolvedValue([]),
  getProfileById: vi.fn().mockResolvedValue({ id: 1, userId: 1, fullName: "John Smith", isActive: true }),
  createProfile: vi.fn().mockResolvedValue({ id: 1 }),
  updateProfile: vi.fn().mockResolvedValue(undefined),
  getAllBrokers: vi.fn().mockResolvedValue([
    { id: 1, name: "Spokeo", domain: "spokeo.com", priorityTier: "critical", removalMethod: "form", difficultyRating: "medium", optOutUrl: "https://spokeo.com/optout", dataTypes: ["name", "address"], isActive: true },
    { id: 2, name: "WhitePages", domain: "whitepages.com", priorityTier: "high", removalMethod: "form", difficultyRating: "medium", optOutUrl: "https://whitepages.com/suppression", dataTypes: ["name", "phone"], isActive: true },
  ]),
  getBrokerCount: vi.fn().mockResolvedValue(148),
  getBrokerById: vi.fn().mockResolvedValue({ id: 1, name: "Spokeo", domain: "spokeo.com", priorityTier: "critical", removalMethod: "form", difficultyRating: "medium", optOutUrl: "https://spokeo.com/optout", notes: "Submit via web form" }),
  getScanResultsByProfile: vi.fn().mockResolvedValue([]),
  upsertScanResult: vi.fn().mockResolvedValue(undefined),
  createRemovalRequest: vi.fn().mockResolvedValue(undefined),
  getRemovalRequestsByProfile: vi.fn().mockResolvedValue([]),
  updateRemovalStatus: vi.fn().mockResolvedValue(undefined),
  getRemovalStats: vi.fn().mockResolvedValue({ pending: 5, submitted: 10, confirmed: 3, reappeared: 1 }),
  calculatePrivacyScore: vi.fn().mockResolvedValue(72),
  getActiveScanCount: vi.fn().mockResolvedValue(14),
  getBreachAlertsByUser: vi.fn().mockResolvedValue([]),
  createBreachAlert: vi.fn().mockResolvedValue(undefined),
  markBreachAlertRead: vi.fn().mockResolvedValue(undefined),
  getUnreadBreachCount: vi.fn().mockResolvedValue(0),
  createMonitoringJob: vi.fn().mockResolvedValue({ id: 1 }),
  getMonitoringJobsByProfile: vi.fn().mockResolvedValue([]),
  getDeindexRequestsByProfile: vi.fn().mockResolvedValue([]),
  createDeindexRequest: vi.fn().mockResolvedValue(undefined),
  updateDeindexStatus: vi.fn().mockResolvedValue(undefined),
  saveLlmRequest: vi.fn().mockResolvedValue(undefined),
  getLlmHistory: vi.fn().mockResolvedValue([]),
  getAllUsers: vi.fn().mockResolvedValue([]),
  getTotalUserCount: vi.fn().mockResolvedValue(0),
  updateBroker: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
  cancelSubscriptionByStripeCustomer: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Dear Sir/Madam, I am writing to request removal of my personal data..." } }],
  }),
}));

// ─── Context Helpers ──────────────────────────────────────────────────────────
function createUserCtx(overrides: Partial<TrpcContext["user"]> = {}): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user-1",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      ...overrides,
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAdminCtx(): TrpcContext {
  return createUserCtx({ role: "admin" });
}

// ─── Subscription Plans ───────────────────────────────────────────────────────
describe("subscription.plans", () => {
  it("returns all three subscription plans", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const plans = await caller.subscription.plans();
    expect(plans).toHaveLength(3);
    expect(plans.map((p) => p.slug)).toEqual(["individual", "family", "organization"]);
  });

  it("Individual plan has maxMembers = 1", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const plans = await caller.subscription.plans();
    const individual = plans.find((p) => p.slug === "individual");
    expect(individual?.maxMembers).toBe(1);
  });

  it("Family plan has maxMembers = 5", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const plans = await caller.subscription.plans();
    const family = plans.find((p) => p.slug === "family");
    expect(family?.maxMembers).toBe(5);
  });

  it("Organization plan has maxMembers = 25", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const plans = await caller.subscription.plans();
    const org = plans.find((p) => p.slug === "organization");
    expect(org?.maxMembers).toBe(25);
  });
});

// ─── Identity Profiles ────────────────────────────────────────────────────────
describe("profile", () => {
  it("lists user profiles", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const profiles = await caller.profile.list();
    expect(Array.isArray(profiles)).toBe(true);
  });

  it("creates a new profile", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const result = await caller.profile.create({
      fullName: "John Michael Smith",
      aliases: ["Johnny Smith"],
      phoneNumbers: ["555-123-4567"],
      emailAddresses: ["john@example.com"],
      dateOfBirth: "1985-06-15",
    });
    expect(result.success).toBe(true);
  });
});

// ─── Data Broker Catalog ──────────────────────────────────────────────────────
describe("broker", () => {
  it("lists all brokers", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const brokers = await caller.broker.list({});
    expect(brokers.length).toBeGreaterThan(0);
  });

  it("returns broker count", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const count = await caller.broker.count();
    expect(count).toBe(148);
  });

  it("gets broker by id", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const broker = await caller.broker.get({ id: 1 });
    expect(broker.name).toBe("Spokeo");
    expect(broker.priorityTier).toBe("critical");
  });
});

// ─── Scan Engine ──────────────────────────────────────────────────────────────
describe("scan", () => {
  it("returns scan results for a profile", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const results = await caller.scan.results({ profileId: 1 });
    expect(Array.isArray(results)).toBe(true);
  });

  it("returns privacy score data", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const data = await caller.scan.privacyScore({ profileId: 1 });
    expect(data.score).toBe(72);
    expect(data.totalBrokers).toBe(148);
  });
});

// ─── Removal Requests ─────────────────────────────────────────────────────────
describe("removal", () => {
  it("lists removal requests for a profile", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const requests = await caller.removal.list({ profileId: 1 });
    expect(Array.isArray(requests)).toBe(true);
  });

  it("returns removal stats with correct status labels", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const stats = await caller.removal.stats({ profileId: 1 });
    expect(stats).toHaveProperty("pending");
    expect(stats).toHaveProperty("submitted");
    expect(stats).toHaveProperty("confirmed");
    expect(stats).toHaveProperty("reappeared");
  });

  it("updates removal status to Confirmed", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const result = await caller.removal.updateStatus({ id: 1, status: "Confirmed" });
    expect(result.success).toBe(true);
  });

  it("updates removal status to Re-appeared", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const result = await caller.removal.updateStatus({ id: 1, status: "Re-appeared" });
    expect(result.success).toBe(true);
  });
});

// ─── Breach Alerts ────────────────────────────────────────────────────────────
describe("breach", () => {
  it("lists breach alerts for user", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const alerts = await caller.breach.list();
    expect(Array.isArray(alerts)).toBe(true);
  });

  it("returns unread breach count", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const count = await caller.breach.unreadCount();
    expect(typeof count).toBe("number");
  });

  it("marks a breach alert as read", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const result = await caller.breach.markRead({ id: 1 });
    expect(result.success).toBe(true);
  });
});

// ─── LLM Assistance ──────────────────────────────────────────────────────────
describe("llm.generate", () => {
  it("generates an opt-out email template", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const result = await caller.llm.generate({
      requestType: "opt_out_email",
      profileName: "John Smith",
      profileEmail: "john@example.com",
    });
    expect(result.content).toBeTruthy();
    expect(typeof result.content).toBe("string");
  });

  it("generates a GDPR/CCPA letter", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const result = await caller.llm.generate({
      requestType: "gdpr_ccpa_letter",
      brokerId: 1,
      profileName: "John Smith",
    });
    expect(result.content).toBeTruthy();
  });

  it("generates manual removal guidance", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const result = await caller.llm.generate({
      requestType: "manual_guidance",
      brokerId: 1,
    });
    expect(result.content).toBeTruthy();
  });

  it("retrieves LLM history", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const history = await caller.llm.history();
    expect(Array.isArray(history)).toBe(true);
  });
});

// ─── Deindex Tracker ─────────────────────────────────────────────────────────
describe("deindex", () => {
  it("lists deindex requests for a profile", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const requests = await caller.deindex.list({ profileId: 1 });
    expect(Array.isArray(requests)).toBe(true);
  });

  it("creates a Google deindex request", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const result = await caller.deindex.create({
      profileId: 1,
      engine: "google",
      targetUrl: "https://example.com/my-data",
      reason: "Personal information removal",
    });
    expect(result.success).toBe(true);
  });

  it("updates deindex status to Submitted", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const result = await caller.deindex.updateStatus({ id: 1, status: "Submitted" });
    expect(result.success).toBe(true);
  });
});

// ─── Admin Panel ──────────────────────────────────────────────────────────────
describe("admin", () => {
  it("returns platform stats for admin", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const stats = await caller.admin.stats();
    expect(stats).toHaveProperty("totalUsers");
    expect(stats).toHaveProperty("totalBrokers");
  });

  it("rejects non-admin users from admin.stats", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    await expect(caller.admin.stats()).rejects.toThrow();
  });

  it("admin can update broker priority tier", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.admin.updateBroker({ id: 1, priorityTier: "high" });
    expect(result.success).toBe(true);
  });
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
describe("auth.logout", () => {
  it("clears session cookie on logout", async () => {
    const ctx = createUserCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});
