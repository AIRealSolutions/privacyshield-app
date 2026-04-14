/**
 * PrivacyShield Stripe Products & Prices
 * Centralized product/price definitions for all subscription tiers.
 */

export const STRIPE_PRODUCTS = {
  individual: {
    monthly: {
      name: "PrivacyShield Individual — Monthly",
      amount: 999, // $9.99 in cents
      currency: "usd",
      interval: "month" as const,
    },
    annual: {
      name: "PrivacyShield Individual — Annual",
      amount: 9999, // $99.99 in cents
      currency: "usd",
      interval: "year" as const,
    },
  },
  family: {
    monthly: {
      name: "PrivacyShield Family — Monthly",
      amount: 1999, // $19.99 in cents
      currency: "usd",
      interval: "month" as const,
    },
    annual: {
      name: "PrivacyShield Family — Annual",
      amount: 19999, // $199.99 in cents
      currency: "usd",
      interval: "year" as const,
    },
  },
  organization: {
    monthly: {
      name: "PrivacyShield Organization — Monthly",
      amount: 4999, // $49.99 in cents
      currency: "usd",
      interval: "month" as const,
    },
    annual: {
      name: "PrivacyShield Organization — Annual",
      amount: 49999, // $499.99 in cents
      currency: "usd",
      interval: "year" as const,
    },
  },
} as const;

export type PlanSlug = keyof typeof STRIPE_PRODUCTS;
export type BillingCycle = "monthly" | "annual";
