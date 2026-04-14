import {
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Subscription Plans ───────────────────────────────────────────────────────
export const subscriptionPlans = mysqlTable("subscription_plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull(),
  slug: varchar("slug", { length: 32 }).notNull().unique(),
  maxMembers: int("maxMembers").notNull().default(1),
  priceMonthly: float("priceMonthly").notNull(),
  priceAnnual: float("priceAnnual").notNull(),
  stripePriceIdMonthly: varchar("stripePriceIdMonthly", { length: 128 }),
  stripePriceIdAnnual: varchar("stripePriceIdAnnual", { length: 128 }),
  features: json("features").$type<string[]>().notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

// ─── User Subscriptions ───────────────────────────────────────────────────────
export const userSubscriptions = mysqlTable("user_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  planId: int("planId").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  status: mysqlEnum("status", ["active", "trialing", "past_due", "cancelled", "incomplete"]).default("incomplete").notNull(),
  billingCycle: mysqlEnum("billingCycle", ["monthly", "annual"]).default("monthly").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSubscription = typeof userSubscriptions.$inferSelect;

// ─── Identity Profiles ────────────────────────────────────────────────────────
export const identityProfiles = mysqlTable("identity_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fullName: varchar("fullName", { length: 256 }).notNull(),
  aliases: json("aliases").$type<string[]>(),
  addresses: json("addresses").$type<{ street: string; city: string; state: string; zip: string; isCurrent: boolean }[]>(),
  phoneNumbers: json("phoneNumbers").$type<string[]>(),
  emailAddresses: json("emailAddresses").$type<string[]>(),
  dateOfBirth: varchar("dateOfBirth", { length: 16 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IdentityProfile = typeof identityProfiles.$inferSelect;
export type InsertIdentityProfile = typeof identityProfiles.$inferInsert;

// ─── Data Broker Catalog ──────────────────────────────────────────────────────
export const dataBrokers = mysqlTable("data_brokers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  domain: varchar("domain", { length: 256 }).notNull().unique(),
  searchUrl: text("searchUrl"),
  optOutUrl: text("optOutUrl"),
  removalMethod: mysqlEnum("removalMethod", ["form", "email", "phone", "account", "manual"]).notNull().default("form"),
  removalEmail: varchar("removalEmail", { length: 320 }),
  priorityTier: mysqlEnum("priorityTier", ["critical", "high", "standard"]).notNull().default("standard"),
  difficultyRating: mysqlEnum("difficultyRating", ["easy", "medium", "hard"]).notNull().default("medium"),
  requiresId: boolean("requiresId").default(false).notNull(),
  requiresPhone: boolean("requiresPhone").default(false).notNull(),
  requiresPayment: boolean("requiresPayment").default(false).notNull(),
  dataTypes: json("dataTypes").$type<string[]>(),
  parentCompany: varchar("parentCompany", { length: 128 }),
  subsidiaries: json("subsidiaries").$type<string[]>(),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DataBroker = typeof dataBrokers.$inferSelect;
export type InsertDataBroker = typeof dataBrokers.$inferInsert;

// ─── Scan Results ─────────────────────────────────────────────────────────────
export const scanResults = mysqlTable("scan_results", {
  id: int("id").autoincrement().primaryKey(),
  profileId: int("profileId").notNull(),
  brokerId: int("brokerId").notNull(),
  foundUrl: text("foundUrl"),
  dataTypesFound: json("dataTypesFound").$type<string[]>(),
  isPresent: boolean("isPresent").default(true).notNull(),
  scanType: mysqlEnum("scanType", ["initial", "weekly", "manual"]).default("initial").notNull(),
  scannedAt: timestamp("scannedAt").defaultNow().notNull(),
});

export type ScanResult = typeof scanResults.$inferSelect;

// ─── Removal Requests ─────────────────────────────────────────────────────────
export const removalRequests = mysqlTable("removal_requests", {
  id: int("id").autoincrement().primaryKey(),
  profileId: int("profileId").notNull(),
  brokerId: int("brokerId").notNull(),
  scanResultId: int("scanResultId"),
  status: mysqlEnum("status", ["Pending", "Submitted", "Confirmed", "Re-appeared"]).default("Pending").notNull(),
  submissionMethod: mysqlEnum("submissionMethod", ["automated", "manual", "email"]).default("automated").notNull(),
  submittedAt: timestamp("submittedAt"),
  confirmedAt: timestamp("confirmedAt"),
  reappearedAt: timestamp("reappearedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RemovalRequest = typeof removalRequests.$inferSelect;

// ─── Breach Alerts ────────────────────────────────────────────────────────────
export const breachAlerts = mysqlTable("breach_alerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  profileId: int("profileId"),
  email: varchar("email", { length: 320 }).notNull(),
  breachName: varchar("breachName", { length: 256 }).notNull(),
  breachDomain: varchar("breachDomain", { length: 256 }),
  breachDate: varchar("breachDate", { length: 16 }),
  dataClasses: json("dataClasses").$type<string[]>(),
  description: text("description"),
  isVerified: boolean("isVerified").default(true).notNull(),
  isSensitive: boolean("isSensitive").default(false).notNull(),
  isFabricated: boolean("isFabricated").default(false).notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  source: mysqlEnum("source", ["hibp", "darkweb", "manual"]).default("hibp").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BreachAlert = typeof breachAlerts.$inferSelect;

// ─── Monitoring Jobs ──────────────────────────────────────────────────────────
export const monitoringJobs = mysqlTable("monitoring_jobs", {
  id: int("id").autoincrement().primaryKey(),
  profileId: int("profileId").notNull(),
  jobType: mysqlEnum("jobType", ["weekly_scan", "breach_check", "manual"]).default("weekly_scan").notNull(),
  status: mysqlEnum("status", ["scheduled", "running", "completed", "failed"]).default("scheduled").notNull(),
  sitesScanned: int("sitesScanned").default(0).notNull(),
  newFindings: int("newFindings").default(0).notNull(),
  reappearances: int("reappearances").default(0).notNull(),
  scheduledAt: timestamp("scheduledAt").defaultNow().notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MonitoringJob = typeof monitoringJobs.$inferSelect;

// ─── Deindex Requests ─────────────────────────────────────────────────────────
export const deindexRequests = mysqlTable("deindex_requests", {
  id: int("id").autoincrement().primaryKey(),
  profileId: int("profileId").notNull(),
  engine: mysqlEnum("engine", ["google", "bing"]).notNull(),
  targetUrl: text("targetUrl").notNull(),
  reason: text("reason"),
  status: mysqlEnum("status", ["Pending", "Submitted", "Confirmed", "Rejected"]).default("Pending").notNull(),
  submittedAt: timestamp("submittedAt"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DeindexRequest = typeof deindexRequests.$inferSelect;

// ─── LLM Assistance Requests ──────────────────────────────────────────────────
export const llmAssistanceRequests = mysqlTable("llm_assistance_requests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  profileId: int("profileId"),
  brokerId: int("brokerId"),
  requestType: mysqlEnum("requestType", ["opt_out_email", "gdpr_ccpa_letter", "manual_guidance"]).notNull(),
  generatedContent: text("generatedContent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LlmAssistanceRequest = typeof llmAssistanceRequests.$inferSelect;
