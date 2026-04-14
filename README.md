# PrivacyShield — Online Identity Protection

**PrivacyShield** is a full-stack SaaS application that automatically finds, tracks, and removes users' personal information from data broker and people-search websites, monitors for re-appearances, and alerts users to data breaches.

## Features

- **148+ Data Broker Catalog** — Organized by priority tier: Critical 💐, High ☠, and Standard, with opt-out URLs, removal methods, and difficulty ratings
- **Identity Profile Intake** — Users enter full name, aliases, addresses, phone numbers, emails, and date of birth
- **Automated Scanning Engine** — Checks each data broker for user identity presence and records found listings
- **Removal Request Tracking** — Tracks each removal through statuses: Pending, Submitted, Confirmed, Re-appeared
- **Privacy Score Dashboard** — Live status board with overall privacy score and removal completion percentage
- **Weekly Monitoring** — Automated re-scan jobs that detect re-appearances of previously removed data
- **Breach Alerts** — Have I Been Pwned (HIBP) integration to alert users when their data appears in known breaches
- **AI Opt-Out Assistant** — LLM-powered generation of opt-out emails, GDPR/CCPA letters, and manual removal guidance
- **Google & Bing Deindex Tracker** — Track search engine deindexing requests
- **Stripe Billing** — Subscription plans: Individual (1 person), Family (up to 5), Organization (up to 25)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Tailwind CSS 4, shadcn/ui |
| Backend | Express 4, tRPC 11 |
| Database | PostgreSQL via Supabase |
| ORM | Drizzle ORM |
| Auth | Manus OAuth + Google OAuth |
| Payments | Stripe |
| Deployment | Vercel |
| Testing | Vitest (30 tests) |

## Subscription Plans

| Plan | Members | Monthly | Annual |
|------|---------|---------|--------|
| Individual | 1 | $9.99 | $99.99 |
| Family | Up to 5 | $19.99 | $199.99 |
| Organization | Up to 25 | $49.99 | $499.99 |

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm
- Supabase account (PostgreSQL database)
- Stripe account
- Google Cloud Console project (for Google OAuth)

### Environment Variables

Create a `.env` file with the following variables:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres

# Auth
JWT_SECRET=your-jwt-secret
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Stripe
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# HIBP (Have I Been Pwned)
HIBP_API_KEY=your-hibp-api-key

# Manus Built-in APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-forge-api-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-forge-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
```

### Installation

```bash
# Clone the repository
git clone https://github.com/AIRealSolutions/privacyshield-app.git
cd privacyshield-app

# Install dependencies
pnpm install

# Run database migrations
pnpm drizzle-kit generate
pnpm drizzle-kit migrate

# Seed data brokers and subscription plans
node scripts/seed-brokers.mjs

# Start development server
pnpm dev
```

### Deployment to Vercel

1. Connect this repository to Vercel
2. Add all environment variables in Vercel project settings
3. Set the Supabase `DATABASE_URL` (PostgreSQL connection string)
4. Configure Stripe webhook endpoint: `https://your-domain.vercel.app/api/stripe/webhook`
5. Deploy

## Data Broker Priority Tiers

| Tier | Label | Description |
|------|-------|-------------|
| Critical | 💐 | High-traffic sites with broad data exposure (Spokeo, WhitePages, BeenVerified) |
| High | ☠ | Significant data brokers requiring prompt removal |
| Standard | — | Smaller or regional data broker sites |

## Removal Status Labels

| Status | Meaning |
|--------|---------|
| Pending | Removal request queued |
| Submitted | Request sent to data broker |
| Confirmed | Broker confirmed data removal |
| Re-appeared | Data was re-listed after removal |

## License

MIT
