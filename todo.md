# PrivacyShield — Project TODO

## Database & Schema
- [x] Data broker catalog table (148 sites, priority tiers, opt-out URLs, removal methods)
- [x] Subscription plans table (Individual/Family/Organization)
- [x] User subscriptions table with Stripe IDs
- [x] Identity profiles table (name, aliases, addresses, phones, emails, DOB)
- [x] Scan results table (source URL, data type, detection timestamp)
- [x] Removal requests table (status: Pending/Submitted/Confirmed/Re-appeared)
- [x] Breach alerts table (HIBP integration)
- [x] Weekly monitoring jobs table
- [x] Search engine deindex requests table (Google/Bing)
- [x] LLM assistance requests table

## Backend / API
- [x] Subscription tier procedures (plans, mySubscription, createCheckout, activate)
- [x] Identity profile CRUD procedures
- [x] Scanning engine: check data broker sites for user identity (priority-weighted)
- [x] Removal request submission and status tracking
- [x] Weekly re-scan job logic (runWeeklyScan)
- [x] HIBP API integration for breach alerts (checkHIBP)
- [x] LLM-powered opt-out email template generation
- [x] LLM-powered GDPR/CCPA letter generation
- [x] LLM-powered manual removal guidance per broker
- [x] Privacy score calculation logic
- [x] Admin procedures (manage brokers, view all users, stats)
- [x] Google/Bing deindex request tracking
- [x] Stripe webhook handler (/api/stripe/webhook) with signature verification
- [x] Stripe Checkout Session creation with metadata

## Frontend — Landing Page
- [x] Hero section with value proposition
- [x] Feature highlights section
- [x] Pricing section (Individual/Family/Organization tiers)
- [x] How it works section
- [x] CTA and login/signup flow

## Frontend — User Dashboard
- [x] Dashboard layout with sidebar navigation (AppLayout)
- [x] Privacy score widget (overall score + completion %)
- [x] Live status board (found listings, removal progress per site)
- [x] Removal requests table with status badges (Pending/Submitted/Confirmed/Re-appeared)
- [x] Breach Alerts section (dedicated, labeled exactly "Breach Alerts")
- [x] Weekly monitoring history/timeline
- [x] Identity profile management page (ProfileSetup)
- [x] LLM assistance panel (opt-out emails, GDPR/CCPA letters, manual guidance)
- [x] Search engine deindex tracker (Google + Bing)
- [x] Subscription management page with Stripe checkout

## Frontend — Admin Panel
- [x] Admin dashboard (user overview, scan stats)
- [x] Data broker catalog management (priority tier, difficulty, enable/disable)
- [x] Priority tier management (Critical 💐 / High ☠ / Standard)

## Payments
- [x] Stripe integration (checkout sessions via createCheckout mutation)
- [x] Stripe webhook (checkout.session.completed, subscription.deleted/updated)
- [x] Subscription status shown in dashboard

## Testing
- [x] 30 vitest tests passing (privacyshield.test.ts + auth.logout.test.ts)
- [x] Subscription plans tests (all 3 tiers, member limits)
- [x] Profile CRUD tests
- [x] Broker catalog tests
- [x] Scan engine and privacy score tests
- [x] Removal request status transition tests (all 4 statuses)
- [x] Breach alert tests
- [x] LLM generation tests (all 3 types)
- [x] Deindex tracker tests
- [x] Admin panel RBAC enforcement tests
- [x] Auth logout test

## Google OAuth & GitHub
- [x] Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to project secrets
- [x] Implement Google OAuth backend route (/api/oauth/google, /api/oauth/google/callback)
- [x] Add Google Sign-In button to landing page and login flow
- [x] Create public GitHub repository: privacyshield-app
- [x] Push project code to GitHub
