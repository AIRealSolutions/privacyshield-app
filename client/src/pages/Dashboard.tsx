import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Shield, Plus, Search, Trash2, Bell, ChevronRight,
  AlertTriangle, CheckCircle, RefreshCw, User
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

function PrivacyScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = ((100 - score) / 100) * circumference;
  const color = score >= 70 ? "#4ade80" : score >= 40 ? "#facc15" : "#f87171";

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-border" />
        <circle
          cx="64" cy="64" r={radius} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-foreground">{score}</span>
        <span className="text-xs text-muted-foreground">Privacy Score</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: profiles, refetch: refetchProfiles } = trpc.profile.list.useQuery();
  const { data: subscription } = trpc.subscription.mySubscription.useQuery();
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [scanning, setScanning] = useState(false);

  const activeProfile = profiles?.[0];
  const profileId = selectedProfileId ?? activeProfile?.id;

  const { data: scoreData, refetch: refetchScore } = trpc.scan.privacyScore.useQuery(
    { profileId: profileId! },
    { enabled: !!profileId }
  );
  const { data: removalStats } = trpc.removal.stats.useQuery(
    { profileId: profileId! },
    { enabled: !!profileId }
  );
  const { data: breachCount } = trpc.breach.unreadCount.useQuery();

  const runScan = trpc.scan.run.useMutation({
    onSuccess: (data) => {
      toast.success(`Scan complete! Found ${data.found} exposures across ${data.scanned} sites.`);
      refetchScore();
      setScanning(false);
    },
    onError: () => {
      toast.error("Scan failed. Please try again.");
      setScanning(false);
    },
  });

  const handleScan = () => {
    if (!profileId) return;
    setScanning(true);
    runScan.mutate({ profileId, scanType: "manual" });
  };

  const completionPct = removalStats?.total
    ? Math.round((removalStats.confirmed / removalStats.total) * 100)
    : 0;

  return (
    <AppLayout title="Dashboard">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
            </h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              {profiles?.length
                ? `Monitoring ${profiles.length} identity profile${profiles.length > 1 ? "s" : ""}`
                : "Set up your identity profile to begin scanning"}
            </p>
          </div>
          <div className="flex gap-2">
            {profileId && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleScan}
                disabled={scanning}
                className="border-border text-foreground hover:bg-secondary"
              >
                {scanning ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                {scanning ? "Scanning..." : "Run Scan"}
              </Button>
            )}
            <Link href="/profile/setup">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                {profiles?.length ? "Add Profile" : "Create Profile"}
              </Button>
            </Link>
          </div>
        </div>

        {/* No Profile CTA */}
        {!profiles?.length && (
          <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Identity Profile Yet</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
              Create your identity profile with your name, addresses, and contact details so we can scan for your data across 148+ broker sites.
            </p>
            <Link href="/profile/setup">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Create Identity Profile
              </Button>
            </Link>
          </div>
        )}

        {/* Stats Grid */}
        {profileId && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Privacy Score */}
              <div className="md:col-span-1 bg-card border border-border rounded-xl p-5 flex flex-col items-center justify-center">
                <PrivacyScoreRing score={scoreData?.score ?? 0} />
                <div className="mt-3 text-center">
                  <div className="text-xs text-muted-foreground">
                    {scoreData?.score && scoreData.score >= 70
                      ? "Good Protection"
                      : scoreData?.score && scoreData.score >= 40
                      ? "Moderate Risk"
                      : "High Exposure"}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  {
                    label: "Active Exposures",
                    value: scoreData?.activeFindings ?? 0,
                    icon: AlertTriangle,
                    color: "text-red-400",
                    bg: "bg-red-500/10",
                  },
                  {
                    label: "Removals Confirmed",
                    value: removalStats?.confirmed ?? 0,
                    icon: CheckCircle,
                    color: "text-green-400",
                    bg: "bg-green-500/10",
                  },
                  {
                    label: "Pending Removal",
                    value: removalStats?.pending ?? 0,
                    icon: RefreshCw,
                    color: "text-yellow-400",
                    bg: "bg-yellow-500/10",
                  },
                  {
                    label: "Re-appeared",
                    value: removalStats?.reappeared ?? 0,
                    icon: AlertTriangle,
                    color: "text-orange-400",
                    bg: "bg-orange-500/10",
                  },
                  {
                    label: "Breach Alerts",
                    value: breachCount ?? 0,
                    icon: Bell,
                    color: "text-purple-400",
                    bg: "bg-purple-500/10",
                  },
                  {
                    label: "Completion",
                    value: `${completionPct}%`,
                    icon: Shield,
                    color: "text-primary",
                    bg: "bg-primary/10",
                  },
                ].map((stat) => (
                  <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
                    <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Removal Progress Bar */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Removal Progress</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {removalStats?.confirmed ?? 0} of {removalStats?.total ?? 0} requests confirmed
                  </p>
                </div>
                <span className="text-sm font-bold text-primary">{completionPct}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Pending: {removalStats?.pending ?? 0}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Submitted: {removalStats?.submitted ?? 0}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Confirmed: {removalStats?.confirmed ?? 0}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Re-appeared: {removalStats?.reappeared ?? 0}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { href: `/scan/${profileId}`, icon: Search, label: "View Scan Results", color: "text-primary" },
                { href: `/removal/${profileId}`, icon: Trash2, label: "Removal Status Board", color: "text-green-400" },
                { href: "/breach-alerts", icon: Bell, label: "Breach Alerts", color: "text-purple-400" },
                { href: "/llm-assistant", icon: Shield, label: "AI Opt-Out Assistant", color: "text-accent" },
              ].map((action) => (
                <Link key={action.href} href={action.href}>
                  <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-colors cursor-pointer group">
                    <action.icon className={`h-5 w-5 ${action.color} mb-3 group-hover:scale-110 transition-transform`} />
                    <div className="text-sm font-medium text-foreground">{action.label}</div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground mt-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>

            {/* Subscription Status */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Subscription</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {subscription?.plan
                      ? `${subscription.plan.name} Plan — ${subscription.sub.status}`
                      : "No active subscription"}
                  </p>
                </div>
                <Link href="/subscription">
                  <Button size="sm" variant="outline" className="border-border text-foreground hover:bg-secondary">
                    {subscription?.sub?.status === "active" ? "Manage" : "Upgrade"}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
