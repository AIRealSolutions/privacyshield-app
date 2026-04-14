import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  breachAlerts,
  dataBrokers,
  deindexRequests,
  identityProfiles,
  llmAssistanceRequests,
  monitoringJobs,
  removalRequests,
  scanResults,
  subscriptionPlans,
  userSubscriptions,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── Subscription Plans ───────────────────────────────────────────────────────
export async function getSubscriptionPlans() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
}

export async function getUserSubscription(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select({ sub: userSubscriptions, plan: subscriptionPlans })
    .from(userSubscriptions)
    .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
    .where(eq(userSubscriptions.userId, userId))
    .orderBy(desc(userSubscriptions.createdAt))
    .limit(1);
  return result[0] ?? null;
}

export async function upsertUserSubscription(data: {
  userId: number;
  planId: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status: "active" | "trialing" | "past_due" | "cancelled" | "incomplete";
  billingCycle: "monthly" | "annual";
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(userSubscriptions).values(data).onDuplicateKeyUpdate({ set: data });
}

// ─── Identity Profiles ────────────────────────────────────────────────────────
export async function getProfilesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(identityProfiles)
    .where(and(eq(identityProfiles.userId, userId), eq(identityProfiles.isActive, true)));
}

export async function getProfileById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(identityProfiles)
    .where(and(eq(identityProfiles.id, id), eq(identityProfiles.userId, userId)))
    .limit(1);
  return result[0] ?? null;
}

export async function createProfile(data: {
  userId: number;
  fullName: string;
  aliases?: string[];
  addresses?: { street: string; city: string; state: string; zip: string; isCurrent: boolean }[];
  phoneNumbers?: string[];
  emailAddresses?: string[];
  dateOfBirth?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(identityProfiles).values(data as any);
  return result[0];
}

export async function updateProfile(
  id: number,
  userId: number,
  data: Partial<{
    fullName: string;
    aliases: string[];
    addresses: { street: string; city: string; state: string; zip: string; isCurrent: boolean }[];
    phoneNumbers: string[];
    emailAddresses: string[];
    dateOfBirth: string;
  }>
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(identityProfiles)
    .set(data as any)
    .where(and(eq(identityProfiles.id, id), eq(identityProfiles.userId, userId)));
}

// ─── Data Brokers ─────────────────────────────────────────────────────────────
export async function getAllBrokers(tier?: "critical" | "high" | "standard") {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(dataBrokers.isActive, true)];
  if (tier) conditions.push(eq(dataBrokers.priorityTier, tier));
  return db.select().from(dataBrokers).where(and(...conditions)).orderBy(dataBrokers.priorityTier, dataBrokers.name);
}

export async function getBrokerById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(dataBrokers).where(eq(dataBrokers.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getBrokerCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(dataBrokers).where(eq(dataBrokers.isActive, true));
  return result[0]?.count ?? 0;
}

// ─── Scan Results ─────────────────────────────────────────────────────────────
export async function getScanResultsByProfile(profileId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ scan: scanResults, broker: dataBrokers })
    .from(scanResults)
    .leftJoin(dataBrokers, eq(scanResults.brokerId, dataBrokers.id))
    .where(eq(scanResults.profileId, profileId))
    .orderBy(desc(scanResults.scannedAt));
}

export async function upsertScanResult(data: {
  profileId: number;
  brokerId: number;
  foundUrl?: string;
  dataTypesFound?: string[];
  isPresent: boolean;
  scanType: "initial" | "weekly" | "manual";
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(scanResults).values(data as any);
}

export async function getActiveScanCount(profileId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(scanResults)
    .where(and(eq(scanResults.profileId, profileId), eq(scanResults.isPresent, true)));
  return result[0]?.count ?? 0;
}

// ─── Removal Requests ─────────────────────────────────────────────────────────
export async function getRemovalRequestsByProfile(profileId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ req: removalRequests, broker: dataBrokers })
    .from(removalRequests)
    .leftJoin(dataBrokers, eq(removalRequests.brokerId, dataBrokers.id))
    .where(eq(removalRequests.profileId, profileId))
    .orderBy(desc(removalRequests.createdAt));
}

export async function createRemovalRequest(data: {
  profileId: number;
  brokerId: number;
  scanResultId?: number;
  submissionMethod: "automated" | "manual" | "email";
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(removalRequests).values({ ...data, status: "Pending" } as any);
}

export async function updateRemovalStatus(
  id: number,
  status: "Pending" | "Submitted" | "Confirmed" | "Re-appeared",
  notes?: string
) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { status };
  if (status === "Submitted") updateData.submittedAt = new Date();
  if (status === "Confirmed") updateData.confirmedAt = new Date();
  if (status === "Re-appeared") updateData.reappearedAt = new Date();
  if (notes) updateData.notes = notes;
  await db.update(removalRequests).set(updateData as any).where(eq(removalRequests.id, id));
}

export async function getRemovalStats(profileId: number) {
  const db = await getDb();
  if (!db) return { pending: 0, submitted: 0, confirmed: 0, reappeared: 0, total: 0 };
  const rows = await db
    .select({ status: removalRequests.status, count: sql<number>`count(*)` })
    .from(removalRequests)
    .where(eq(removalRequests.profileId, profileId))
    .groupBy(removalRequests.status);

  const stats = { pending: 0, submitted: 0, confirmed: 0, reappeared: 0, total: 0 };
  for (const row of rows) {
    const c = Number(row.count);
    stats.total += c;
    if (row.status === "Pending") stats.pending = c;
    if (row.status === "Submitted") stats.submitted = c;
    if (row.status === "Confirmed") stats.confirmed = c;
    if (row.status === "Re-appeared") stats.reappeared = c;
  }
  return stats;
}

// ─── Breach Alerts ────────────────────────────────────────────────────────────
export async function getBreachAlertsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(breachAlerts)
    .where(eq(breachAlerts.userId, userId))
    .orderBy(desc(breachAlerts.createdAt));
}

export async function createBreachAlert(data: {
  userId: number;
  profileId?: number;
  email: string;
  breachName: string;
  breachDomain?: string;
  breachDate?: string;
  dataClasses?: string[];
  description?: string;
  isVerified?: boolean;
  isSensitive?: boolean;
  source?: "hibp" | "darkweb" | "manual";
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(breachAlerts).values(data as any);
}

export async function markBreachAlertRead(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(breachAlerts)
    .set({ isRead: true })
    .where(and(eq(breachAlerts.id, id), eq(breachAlerts.userId, userId)));
}

export async function getUnreadBreachCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(breachAlerts)
    .where(and(eq(breachAlerts.userId, userId), eq(breachAlerts.isRead, false)));
  return result[0]?.count ?? 0;
}

// ─── Monitoring Jobs ──────────────────────────────────────────────────────────
export async function getMonitoringJobsByProfile(profileId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(monitoringJobs)
    .where(eq(monitoringJobs.profileId, profileId))
    .orderBy(desc(monitoringJobs.createdAt))
    .limit(20);
}

export async function createMonitoringJob(data: {
  profileId: number;
  jobType: "weekly_scan" | "breach_check" | "manual";
}) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(monitoringJobs).values({ ...data, status: "scheduled" } as any);
  return result;
}

export async function updateMonitoringJob(
  id: number,
  data: Partial<{
    status: "scheduled" | "running" | "completed" | "failed";
    sitesScanned: number;
    newFindings: number;
    reappearances: number;
    startedAt: Date;
    completedAt: Date;
    errorMessage: string;
  }>
) {
  const db = await getDb();
  if (!db) return;
  await db.update(monitoringJobs).set(data as any).where(eq(monitoringJobs.id, id));
}

// ─── Deindex Requests ─────────────────────────────────────────────────────────
export async function getDeindexRequestsByProfile(profileId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(deindexRequests)
    .where(eq(deindexRequests.profileId, profileId))
    .orderBy(desc(deindexRequests.createdAt));
}

export async function createDeindexRequest(data: {
  profileId: number;
  engine: "google" | "bing";
  targetUrl: string;
  reason?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(deindexRequests).values({ ...data, status: "Pending" } as any);
}

export async function updateDeindexStatus(
  id: number,
  status: "Pending" | "Submitted" | "Confirmed" | "Rejected"
) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { status };
  if (status === "Submitted") updateData.submittedAt = new Date();
  if (status === "Confirmed" || status === "Rejected") updateData.resolvedAt = new Date();
  await db.update(deindexRequests).set(updateData as any).where(eq(deindexRequests.id, id));
}

// ─── LLM Assistance ───────────────────────────────────────────────────────────
export async function saveLlmRequest(data: {
  userId: number;
  profileId?: number;
  brokerId?: number;
  requestType: "opt_out_email" | "gdpr_ccpa_letter" | "manual_guidance";
  generatedContent: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(llmAssistanceRequests).values(data as any);
}

export async function getLlmHistory(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(llmAssistanceRequests)
    .where(eq(llmAssistanceRequests.userId, userId))
    .orderBy(desc(llmAssistanceRequests.createdAt))
    .limit(50);
}

// ─── Privacy Score ────────────────────────────────────────────────────────────
export async function calculatePrivacyScore(profileId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const totalBrokers = await getBrokerCount();
  if (totalBrokers === 0) return 100;

  const stats = await getRemovalStats(profileId);
  const activeFindings = await getActiveScanCount(profileId);

  // Score formula: start at 100, subtract for each active finding weighted by tier
  // Confirmed removals add back points
  const exposureRatio = activeFindings / totalBrokers;
  const confirmationBonus = stats.confirmed / Math.max(stats.total, 1);

  const rawScore = Math.max(0, Math.min(100, Math.round(
    100 - (exposureRatio * 60) + (confirmationBonus * 20)
  )));

  return rawScore;
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export async function getAllUsers(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).limit(limit).offset(offset).orderBy(desc(users.createdAt));
}

export async function getTotalUserCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(users);
  return result[0]?.count ?? 0;
}

export async function updateBroker(id: number, data: Partial<{
  name: string;
  optOutUrl: string;
  priorityTier: "critical" | "high" | "standard";
  difficultyRating: "easy" | "medium" | "hard";
  isActive: boolean;
  notes: string;
}>) {
  const db = await getDb();
  if (!db) return;
  await db.update(dataBrokers).set(data as any).where(eq(dataBrokers.id, id));
}

export async function cancelSubscriptionByStripeCustomer(stripeCustomerId: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(userSubscriptions)
    .set({ status: "cancelled" })
    .where(eq(userSubscriptions.stripeCustomerId, stripeCustomerId));
}
