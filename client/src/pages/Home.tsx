import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";

import {
  Shield, Search, Trash2, Bell, BarChart3, Bot, Eye, Lock,
  ChevronRight, CheckCircle, Star, Users, Building2, User
} from "lucide-react";

import { Link } from "wouter";

function getGoogleLoginUrl(returnPath = "/dashboard") {
  const params = new URLSearchParams({ returnPath });
  return `/api/oauth/google?${params.toString()}`;
}

const FEATURES = [
  { icon: Search, title: "150+ Data Broker Scans", desc: "We scan Spokeo, WhitePages, BeenVerified, Radaris, MyLife, ZoomInfo, and 140+ more sites for your personal data." },
  { icon: Trash2, title: "Automated Removal Requests", desc: "Opt-out forms, emails, and manual guidance submitted on your behalf. Track every request from Pending to Confirmed." },
  { icon: Bell, title: "Breach Alerts", desc: "Integrated with HaveIBeenPwned to instantly alert you when your email or data appears in a known data breach." },
  { icon: BarChart3, title: "Privacy Score Dashboard", desc: "Live privacy score showing your exposure level, removal completion rate, and site-by-site status board." },
  { icon: Eye, title: "Weekly Re-Scan Monitoring", desc: "Automated weekly scans detect re-appearances of previously removed data and trigger new removal requests." },
  { icon: Bot, title: "AI-Powered Opt-Out Assistant", desc: "Generate personalized opt-out emails, GDPR/CCPA letters, and step-by-step manual removal guides using AI." },
  { icon: Lock, title: "Search Engine Deindexing", desc: "Track Google and Bing deindex requests to remove your personal information from search engine results." },
  { icon: Shield, title: "Priority Tier Targeting", desc: "Critical 💐, High ☠, and Standard brokers are prioritized so the most dangerous exposures are removed first." },
];

const PLANS = [
  {
    name: "Individual",
    icon: User,
    price: "$9.99",
    annual: "$99.99/yr",
    members: "1 person",
    features: ["Scan 150+ data broker sites", "Automated removal requests", "Weekly re-scan monitoring", "Breach Alerts (HIBP)", "Privacy score dashboard", "AI opt-out assistant", "Google & Bing deindex tracking"],
    cta: "Get Started",
    slug: "individual",
    highlight: false,
  },
  {
    name: "Family",
    icon: Users,
    price: "$19.99",
    annual: "$199.99/yr",
    members: "Up to 5 members",
    features: ["Everything in Individual", "Up to 5 family members", "Family privacy overview", "Shared breach dashboard", "Priority removal processing", "Monthly detailed reports", "Dedicated support"],
    cta: "Protect Your Family",
    slug: "family",
    highlight: true,
  },
  {
    name: "Organization",
    icon: Building2,
    price: "$49.99",
    annual: "$499.99/yr",
    members: "Up to 25 members",
    features: ["Everything in Family", "Up to 25 members", "Organization-wide dashboard", "Bulk identity scanning", "GDPR/CCPA compliance reports", "API access", "Dedicated account manager", "SLA guarantee"],
    cta: "Protect Your Team",
    slug: "organization",
    highlight: false,
  },
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { data: brokerCount } = trpc.broker.count.useQuery();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-foreground">PrivacyShield</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/brokers" className="hover:text-foreground transition-colors">Broker Catalog</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Dashboard <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            ) : (
              <div className="flex gap-2">
                <a href={getLoginUrl()}>
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Get Started <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </a>
                <a href={getGoogleLoginUrl()}>
                  <Button size="sm" variant="outline" className="border-border text-foreground hover:bg-secondary flex items-center gap-2">
                    <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Google
                  </Button>
                </a>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container relative text-center">
          <Badge className="mb-6 bg-primary/20 text-primary border-primary/30 px-4 py-1.5 text-sm">
            🛡️ {brokerCount ?? "148"}+ Data Broker Sites Monitored
          </Badge>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Your Personal Data
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Removed. Protected. Monitored.
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            PrivacyShield automatically finds where your personal information is exposed online, submits removal requests, monitors for re-appearances, and alerts you to data breaches — all in one dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 text-base font-semibold">
                  Open Dashboard <ChevronRight className="h-5 w-5 ml-1" />
                </Button>
              </Link>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={getLoginUrl()}>
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 text-base font-semibold">
                    Start Protecting Yourself <ChevronRight className="h-5 w-5 ml-1" />
                  </Button>
                </a>
                <a href={getGoogleLoginUrl()}>
                  <Button size="lg" variant="outline" className="px-8 h-12 text-base border-border text-foreground hover:bg-secondary flex items-center gap-2">
                    <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Continue with Google
                  </Button>
                </a>
              </div>
            )}
            <Link href="/brokers">
              <Button size="lg" variant="outline" className="px-8 h-12 text-base border-border text-foreground hover:bg-secondary">
                View Broker Catalog
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { value: `${brokerCount ?? "148"}+`, label: "Sites Monitored" },
              { value: "Weekly", label: "Re-Scan Cadence" },
              { value: "3 Tiers", label: "Priority Levels" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 border-t border-border/30">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">How PrivacyShield Works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Four steps to comprehensive online privacy protection.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Create Your Profile", desc: "Enter your name, addresses, phone numbers, and emails to define your identity footprint." },
              { step: "02", title: "Automated Scan", desc: "We scan 148+ data broker sites and people-search engines for your personal information." },
              { step: "03", title: "Removal Requests", desc: "Opt-out requests are submitted automatically. Track each one from Pending to Confirmed." },
              { step: "04", title: "Weekly Monitoring", desc: "We re-scan every week and alert you to re-appearances, breaches, and new exposures." },
            ].map((item) => (
              <div key={item.step} className="relative bg-card border border-border rounded-xl p-6">
                <div className="text-5xl font-black text-primary/20 mb-3">{item.step}</div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-border/30">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Everything You Need for Online Privacy</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">A complete toolkit to find, remove, and monitor your personal data across the web.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2 text-sm">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Priority Tiers */}
      <section className="py-20 border-t border-border/30">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Prioritized Removal Strategy</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Not all data brokers are equal. We tackle the most dangerous exposures first.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { tier: "Critical 💐", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", desc: "High-traffic people-search sites with comprehensive personal data. BeenVerified, Spokeo, WhitePages, MyLife, Radaris, Intelius, and more." },
              { tier: "High ☠", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30", desc: "Data aggregators, credit bureaus, and business intelligence platforms. Acxiom, ZoomInfo, LexisNexis, Equifax, Experian, and more." },
              { tier: "Standard", color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/30", desc: "Secondary people-search sites, regional directories, and niche data brokers. 100+ sites continuously monitored." },
            ].map((t) => (
              <div key={t.tier} className={`rounded-xl border p-6 ${t.bg}`}>
                <div className={`text-xl font-bold mb-3 ${t.color}`}>{t.tier}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 border-t border-border/30">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Choose the plan that fits your needs. Cancel anytime.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-7 flex flex-col ${
                  plan.highlight
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border bg-card"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4">Most Popular</Badge>
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <plan.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{plan.name}</div>
                    <div className="text-xs text-muted-foreground">{plan.members}</div>
                  </div>
                </div>
                <div className="mb-5">
                  <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">/month</span>
                  <div className="text-xs text-muted-foreground mt-1">{plan.annual} billed annually</div>
                </div>
                <ul className="space-y-2 mb-7 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                {isAuthenticated ? (
                  <Link href={`/subscription?plan=${plan.slug}`}>
                    <Button
                      className={`w-full ${plan.highlight ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                ) : (
                  <a href={getLoginUrl()}>
                    <Button
                      className={`w-full ${plan.highlight ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
                    >
                      {plan.cta}
                    </Button>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-10">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">PrivacyShield</span>
          </div>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} PrivacyShield. All rights reserved.</p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/brokers" className="hover:text-foreground transition-colors">Broker Catalog</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
