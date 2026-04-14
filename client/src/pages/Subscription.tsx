import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { CheckCircle, User, Users, Building2, CreditCard, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSearch } from "wouter";

const PLAN_ICONS: Record<string, React.ElementType> = {
  individual: User,
  family: Users,
  organization: Building2,
};

export default function Subscription() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const defaultPlan = params.get("plan") || "";

  const [selectedPlan, setSelectedPlan] = useState(defaultPlan);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [activating, setActivating] = useState(false);

  const { data: plans } = trpc.subscription.plans.useQuery();
  const { data: currentSub, refetch } = trpc.subscription.mySubscription.useQuery();

  const createCheckout = trpc.subscription.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.success("Redirecting to Stripe checkout...");
        window.open(data.url, "_blank");
      }
      setActivating(false);
    },
    onError: (e) => { toast.error(e.message); setActivating(false); },
  });

  const handleActivate = () => {
    if (!selectedPlan) return toast.error("Please select a plan");
    setActivating(true);
    createCheckout.mutate({
      planSlug: selectedPlan as "individual" | "family" | "organization",
      billingCycle,
      origin: window.location.origin,
    });
  };

  const isActive = currentSub?.sub?.status === "active";

  return (
    <AppLayout title="Subscription">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Subscription & Billing</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Choose the plan that best fits your privacy protection needs.
          </p>
        </div>

        {/* Current Subscription */}
        {isActive && currentSub?.plan && (
          <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div>
                  <div className="font-semibold text-foreground">Active: {currentSub.plan.name} Plan</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {currentSub.sub.billingCycle === "annual" ? "Annual" : "Monthly"} billing ·{" "}
                    {currentSub.sub.currentPeriodEnd
                      ? `Renews ${new Date(currentSub.sub.currentPeriodEnd).toLocaleDateString()}`
                      : "Active"}
                  </div>
                </div>
              </div>
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Active</Badge>
            </div>
          </div>
        )}

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              billingCycle === "monthly"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("annual")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              billingCycle === "annual"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Annual
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">Save 17%</Badge>
          </button>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans?.map((plan) => {
            const Icon = PLAN_ICONS[plan.slug] ?? Shield;
            const isSelected = selectedPlan === plan.slug;
            const isCurrent = currentSub?.plan?.slug === plan.slug && isActive;
            const price = billingCycle === "annual"
              ? plan.priceAnnual
              : plan.priceMonthly;

            return (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.slug)}
                className={`relative text-left rounded-2xl border p-6 transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <Badge className="bg-green-500 text-white text-xs">Current Plan</Badge>
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{plan.name}</div>
                    <div className="text-xs text-muted-foreground">{plan.maxMembers} member{plan.maxMembers > 1 ? "s" : ""}</div>
                  </div>
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-extrabold text-foreground">
                    ${billingCycle === "annual"
                      ? (Number(plan.priceAnnual) / 12).toFixed(2)
                      : Number(plan.priceMonthly).toFixed(2)}
                  </span>
                  <span className="text-muted-foreground text-sm">/month</span>
                  {billingCycle === "annual" && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      ${Number(plan.priceAnnual).toFixed(2)}/year
                    </div>
                  )}
                </div>
                <ul className="space-y-1.5">
                  {((plan.features as string[] | null) ?? []).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Checkout */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-primary" />
              <div>
                <div className="font-semibold text-foreground text-sm">
                  {selectedPlan
                    ? `${plans?.find((p) => p.slug === selectedPlan)?.name ?? ""} — ${billingCycle === "annual" ? "Annual" : "Monthly"}`
                    : "Select a plan to continue"}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Secure payment powered by Stripe
                </div>
              </div>
            </div>
            <Button
              onClick={handleActivate}
              disabled={!selectedPlan || activating}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {activating ? "Processing..." : isActive ? "Change Plan" : "Subscribe Now"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            By subscribing, you agree to our Terms of Service. Cancel anytime. Stripe processes all payments securely.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
