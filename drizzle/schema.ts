import {
  boolean,
  integer,
  json,
  pgEnum,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const removalMethodEnum = pgEnum("removal_method", ["form", "email", "phone", "account", "manual"]);
export const priorityTierEnum = pgEnum("priority_tier", ["critical", "high", "standard"]);
export const difficultyRatingEnum = pgEnum("difficulty_rating", ["easy", "medium", "hard"]);
export const scanTypeEnum = pgEnum("scan_type", ["initial", "weekly", "manual"]);
export const removalStatusEnum = pgEnum("removal_status", ["Pending", "Submitted", "Confirmed", "Re-appeared"]);
export const submissionMethodEnum = pgEnum("submission_method", ["automated", "manual", "email"]);
export const breachSourceEnum = pgEnum("breach_source", ["hibp", "darkweb", "manual"]);
export const jobTypeEnum = pgEnum("job_type", ["weekly_scan", "breach_check", "manual"]);
export const jobStatusEnum = pgEnum("job_status", ["scheduled", "running", "completed", "failed"]);
export const engineEnum = pgEnum("engine", ["google", "bing"]);
export const deindexStatusEnum = pgEnum("deindex_status", ["Pending", "Submitted", "Confirmed", "Rejected"]);
export const llmRequestTypeEnum = pgEnum("llm_request_type", ["opt_out_email", "gdpr_ccpa_letter", "manual_guidance"]);
export const billingCycleEnum = pgEnum("billing_cycle", ["monthly", "annual"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "trialing", "past_due", "cancelled", "incomplete"]);

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Subscription Plans ───────────────────────────────────────────────────────
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 64 }).notNull(),
  slug: varchar("slug", { length: 32 }).notNull().unique(),
  maxMembers: integer("maxMembers").notNull().default(1),
  priceMonthly: real("priceMonthly").notNull(),
  priceAnnual: real("priceAnnual").notNull(),
  stripePriceIdMonthly: varchar("stripePriceIdMonthly", { length: 128 }),
  stripePriceIdAnnual: varchar("stripePriceIdAnnual", { length: 128 }),
  features: json("features").$type<string[]>().notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

// ─── User Subscriptions ───────────────────────────────────────────────────────
export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  planId: integer("planId").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  status: subscriptionStatusEnum("status").default("incomplete").notNull(),
  billingCycle: billingCycleEnum("billingCycle").default("monthly").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type UserSubscription = typeof userSubscriptions.$inferSelect;

// ─── Identity Profiles ────────────────────────────────────────────────────────
export const identityProfiles = pgTable("identity_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  fullName: varchar("fullName", { length: 256 }).notNull(),
  aliases: json("aliases").$type<string[]>(),
  addresses: json("addresses").$type<{ street: string; city: string; state: string; zip: string; isCurrent: boolean }[]>(),
  phoneNumbers: json("phoneNumbers").$type<string[]>(),
  emailAddresses: json("emailAddresses").$type<string[]>(),
  dateOfBirth: varchar("dateOfBirth", { length: 16 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type IdentityProfile = typeof identityProfiles.$inferSelect;
export type InsertIdentityProfile = typeof identityProfiles.$inferInsert;

// ─── Data Broker Catalog ──────────────────────────────────────────────────────
export const dataBrokers = pgTable("data_brokers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  domain: varchar("domain", { length: 256 }).notNull().unique(),
  searchUrl: text("searchUrl"),
  optOutUrl: text("optOutUrl"),
  removalMethod: removalMethodEnum("removalMethod").notNull().default("form"),
  removalEmail: varchar("removalEmail", { length: 320 }),
  priorityTier: priorityTierEnum("priorityTier").notNull().default("standard"),
  difficultyRating: difficultyRatingEnum("difficultyRating").notNull().default("medium"),
  requiresId: boolean("requiresId").default(false).notNull(),
  requiresPhone: boolean("requiresPhone").default(false).notNull(),
  requiresPayment: boolean("requiresPayment").default(false).notNull(),
  dataTypes: json("dataTypes").$type<string[]>(),
  parentCompany: varchar("parentCompany", { length: 128 }),
  subsidiaries: json("subsidiaries").$type<string[]>(),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type DataBroker = typeof dataBrokers.$inferSelect;
export type InsertDataBroker = typeof dataBrokers.$inferInsert;

// ─── Scan Results ─────────────────────────────────────────────────────────────
export const scanResults = pgTable("scan_results", {
  id: serial("id").primaryKey(),
  profileId: integer("profileId").notNull(),
  brokerId: integer("brokerId").notNull(),
  foundUrl: text("foundUrl"),
  dataTypesFound: json("dataTypesFound").$type<string[]>(),
  isPresent: boolean("isPresent").default(true).notNull(),
  scanType: scanTypeEnum("scanType").default("initial").notNull(),
  scannedAt: timestamp("scannedAt").defaultNow().notNull(),
});

export type ScanResult = typeof scanResults.$inferSelect;

// ─── Removal Requests ─────────────────────────────────────────────────────────
export const removalRequests = pgTable("removal_requests", {
  id: serial("id").primaryKey(),
  profileId: integer("profileId").notNull(),
  brokerId: integer("brokerId").notNull(),
  scanResultId: integer("scanResultId"),
  status: removalStatusEnum("status").default("Pending").notNull(),
  submissionMethod: submissionMethodEnum("submissionMethod").default("automated").notNull(),
  submittedAt: timestamp("submittedAt"),
  confirmedAt: timestamp("confirmedAt"),
  reappearedAt: timestamp("reappearedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type RemovalRequest = typeof removalRequests.$inferSelect;

// ─── Breach Alerts ────────────────────────────────────────────────────────────
export const breachAlerts = pgTable("breach_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  profileId: integer("profileId"),
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
  source: breachSourceEnum("source").default("hibp").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BreachAlert = typeof breachAlerts.$inferSelect;

// ─── Monitoring Jobs ──────────────────────────────────────────────────────────
export const monitoringJobs = pgTable("monitoring_jobs", {
  id: serial("id").primaryKey(),
  profileId: integer("profileId").notNull(),
  jobType: jobTypeEnum("jobType").default("weekly_scan").notNull(),
  status: jobStatusEnum("status").default("scheduled").notNull(),
  sitesScanned: integer("sitesScanned").default(0).notNull(),
  newFindings: integer("newFindings").default(0).notNull(),
  reappearances: integer("reappearances").default(0).notNull(),
  scheduledAt: timestamp("scheduledAt").defaultNow().notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MonitoringJob = typeof monitoringJobs.$inferSelect;

// ─── Deindex Requests ─────────────────────────────────────────────────────────
export const deindexRequests = pgTable("deindex_requests", {
  id: serial("id").primaryKey(),
  profileId: integer("profileId").notNull(),
  engine: engineEnum("engine").notNull(),
  targetUrl: text("targetUrl").notNull(),
  reason: text("reason"),
  status: deindexStatusEnum("status").default("Pending").notNull(),
  submittedAt: timestamp("submittedAt"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type DeindexRequest = typeof deindexRequests.$inferSelect;

// ─── LLM Assistance Requests ──────────────────────────────────────────────────
export const llmAssistanceRequests = pgTable("llm_assistance_requests", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  profileId: integer("profileId"),
  brokerId: integer("brokerId"),
  requestType: llmRequestTypeEnum("requestType").notNull(),
  generatedContent: text("generatedContent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LlmAssistanceRequest = typeof llmAssistanceRequests.$inferSelect;
