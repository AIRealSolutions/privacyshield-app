import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Shield, Users, BookOpen, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const TIER_LABELS: Record<string, string> = {
  critical: "Critical 💐",
  high: "High ☠",
  standard: "Standard",
};

const TIER_CLASSES: Record<string, string> = {
  critical: "bg-red-500/20 text-red-300 border-red-500/30",
  high: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  standard: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

export default function AdminPanel() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"overview" | "users" | "brokers">("overview");
  const [brokerFilter, setBrokerFilter] = useState("");

  const { data: stats } = trpc.admin.stats.useQuery();
  const { data: usersData } = trpc.admin.users.useQuery({ limit: 50, offset: 0 }, { enabled: tab === "users" });
  const { data: brokers, refetch: refetchBrokers } = trpc.admin.brokers.useQuery({}, { enabled: tab === "brokers" });

  const updateBroker = trpc.admin.updateBroker.useMutation({
    onSuccess: () => { toast.success("Broker updated"); refetchBrokers(); },
    onError: () => toast.error("Failed to update broker"),
  });

  if (user?.role !== "admin") {
    return (
      <AppLayout title="Admin Panel">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Access denied. Admin role required.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const filteredBrokers = (brokers ?? []).filter((b) =>
    !brokerFilter || b.name.toLowerCase().includes(brokerFilter.toLowerCase())
  );

  return (
    <AppLayout title="Admin Panel">
      <div className="max-w-5xl mx-auto space-y-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">Admin Panel</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage users, data brokers, and platform settings.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-secondary/50 rounded-lg p-1 w-fit">
          {(["overview", "users", "brokers"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-primary" },
              { label: "Data Brokers", value: stats?.totalBrokers ?? 0, icon: BookOpen, color: "text-accent" },
            ].map((s) => (
              <div key={s.label} className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                </div>
                <div className="text-3xl font-bold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Users */}
        {tab === "users" && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <div className="col-span-3">Name</div>
              <div className="col-span-4">Email</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-3">Joined</div>
            </div>
            <div className="divide-y divide-border">
              {(usersData?.users ?? []).map((u) => (
                <div key={u.id} className="grid grid-cols-12 gap-3 px-4 py-3 items-center">
                  <div className="col-span-3 font-medium text-foreground text-sm">{u.name || "—"}</div>
                  <div className="col-span-4 text-xs text-muted-foreground">{u.email || "—"}</div>
                  <div className="col-span-2">
                    <Badge className={u.role === "admin" ? "bg-primary/20 text-primary border-primary/30 text-xs" : "bg-secondary text-secondary-foreground border-border text-xs"}>
                      {u.role}
                    </Badge>
                  </div>
                  <div className="col-span-3 text-xs text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Brokers */}
        {tab === "brokers" && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={brokerFilter}
                onChange={(e) => setBrokerFilter(e.target.value)}
                placeholder="Search brokers..."
                className="pl-9 bg-input border-border text-foreground"
              />
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <div className="col-span-3">Name</div>
                <div className="col-span-2">Domain</div>
                <div className="col-span-2">Priority</div>
                <div className="col-span-2">Difficulty</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1">Edit</div>
              </div>
              <div className="divide-y divide-border max-h-96 overflow-y-auto">
                {filteredBrokers.map((b) => (
                  <div key={b.id} className="grid grid-cols-12 gap-3 px-4 py-2.5 items-center hover:bg-secondary/30 transition-colors">
                    <div className="col-span-3 font-medium text-foreground text-sm">{b.name}</div>
                    <div className="col-span-2 text-xs text-muted-foreground">{b.domain}</div>
                    <div className="col-span-2">
                      <Select
                        value={b.priorityTier}
                        onValueChange={(val) => updateBroker.mutate({ id: b.id, priorityTier: val as "critical" | "high" | "standard" })}
                      >
                        <SelectTrigger className="h-7 text-xs bg-secondary border-border text-foreground w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="critical">Critical 💐</SelectItem>
                          <SelectItem value="high">High ☠</SelectItem>
                          <SelectItem value="standard">Standard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Select
                        value={b.difficultyRating}
                        onValueChange={(val) => updateBroker.mutate({ id: b.id, difficultyRating: val as "easy" | "medium" | "hard" })}
                      >
                        <SelectTrigger className="h-7 text-xs bg-secondary border-border text-foreground w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Badge className={b.isActive ? "bg-green-500/20 text-green-300 border-green-500/30 text-xs" : "bg-red-500/20 text-red-300 border-red-500/30 text-xs"}>
                        {b.isActive ? "Active" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="col-span-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => updateBroker.mutate({ id: b.id, isActive: !b.isActive })}
                      >
                        {b.isActive ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
