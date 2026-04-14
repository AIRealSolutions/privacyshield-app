import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Shield, CheckCircle, User, Users, Building2, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

const PLAN_ICONS: Record<string, React.ElementType> = {
  individual: User,
  family: Users,
  organization: Building2,
};

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const { data: plans } = trpc.subscription.plans.useQuery();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-foreground">PrivacyShield</span>
          </Link>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Dashboard <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Get Started
              </Button>
            </a>
          )}
        </div>
      </nav>

      <div className="container py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-foreground mb-3">Simple, Transparent Pricing</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Protect your personal data online. Choose the plan that fits your needs and cancel anytime.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              billingCycle === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("annual")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              billingCycle === "annual" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Annual
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">Save 17%</Badge>
          </button>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {(plans ?? []).map((plan, idx) => {
            const Icon = PLAN_ICONS[plan.slug] ?? Shield;
            const isPopular = plan.slug === "family";
            const monthlyPrice = billingCycle === "annual"
              ? (Number(plan.priceAnnual) / 12).toFixed(2)
              : Number(plan.priceMonthly).toFixed(2);

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-7 flex flex-col ${
                  isPopular
                    ? "border-primary bg-primary/5 shadow-xl shadow-primary/10"
                    : "border-border bg-card"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4">Most Popular</Badge>
                  </div>
                )}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-lg text-foreground">{plan.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {plan.maxMembers === 1 ? "1 person" : `Up to ${plan.maxMembers} members`}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-foreground">${monthlyPrice}</span>
                    <span className="text-muted-foreground text-sm mb-1">/month</span>
                  </div>
                  {billingCycle === "annual" && (
                    <div className="text-xs text-muted-foreground mt-1">
                      ${Number(plan.priceAnnual).toFixed(2)} billed annually
                    </div>
                  )}
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {((plan.features as string[] | null) ?? []).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isAuthenticated ? (
                  <Link href={`/subscription?plan=${plan.slug}`}>
                    <Button
                      className={`w-full h-11 font-semibold ${
                        isPopular
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      Get Started
                    </Button>
                  </Link>
                ) : (
                  <a href={getLoginUrl()}>
                    <Button
                      className={`w-full h-11 font-semibold ${
                        isPopular
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      Get Started
                    </Button>
                  </a>
                )}
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: "How does PrivacyShield find my data?", a: "We scan 148+ data broker and people-search sites using your name, addresses, phone numbers, and email addresses to identify where your personal information is publicly listed." },
              { q: "How are removal requests submitted?", a: "We automatically submit opt-out forms and email requests where possible. For sites requiring manual removal, our AI assistant generates step-by-step guidance and personalized letters." },
              { q: "What happens if my data re-appears?", a: "Our weekly automated re-scans detect re-appearances. When found, a new removal request is automatically created and you are notified immediately." },
              { q: "What is the Breach Alerts feature?", a: "We integrate with HaveIBeenPwned to check if your email addresses appear in known data breaches. Alerts are displayed in your dedicated Breach Alerts section." },
              { q: "Can I cancel anytime?", a: "Yes. You can cancel your subscription at any time. Your protection continues until the end of your current billing period." },
            ].map((item) => (
              <div key={item.q} className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground text-sm mb-2">{item.q}</h3>
                <p className="text-sm text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
