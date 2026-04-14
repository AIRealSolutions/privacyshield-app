import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Search, ExternalLink, Shield } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

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

const DIFFICULTY_CLASSES: Record<string, string> = {
  easy: "bg-green-500/20 text-green-300 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  hard: "bg-red-500/20 text-red-300 border-red-500/30",
};

export default function BrokerCatalog() {
  const { isAuthenticated } = useAuth();
  const [filter, setFilter] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");

  const { data: brokers } = trpc.broker.list.useQuery({
    tier: tierFilter !== "all" ? (tierFilter as "critical" | "high" | "standard") : undefined,
  });

  const filtered = (brokers ?? []).filter((b) => {
    if (!filter) return true;
    return b.name.toLowerCase().includes(filter.toLowerCase()) || b.domain.toLowerCase().includes(filter.toLowerCase());
  });

  const criticalCount = brokers?.filter((b) => b.priorityTier === "critical").length ?? 0;
  const highCount = brokers?.filter((b) => b.priorityTier === "high").length ?? 0;
  const standardCount = brokers?.filter((b) => b.priorityTier === "standard").length ?? 0;

  const Wrapper = isAuthenticated
    ? ({ children }: { children: React.ReactNode }) => <AppLayout title="Broker Catalog">{children}</AppLayout>
    : ({ children }: { children: React.ReactNode }) => (
        <div className="min-h-screen bg-background text-foreground">
          <nav className="border-b border-border/50 bg-background/80 backdrop-blur-md">
            <div className="container flex items-center justify-between h-16">
              <a href="/" className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <span className="font-bold text-foreground">PrivacyShield</span>
              </a>
              <a href="/">
                <Button size="sm" variant="outline" className="border-border text-foreground">← Back</Button>
              </a>
            </div>
          </nav>
          <div className="container py-8">{children}</div>
        </div>
      );

  return (
    <Wrapper>
      <div className="max-w-5xl mx-auto space-y-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">Data Broker Catalog</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {brokers?.length ?? 0} data broker and people-search sites monitored and tracked for removal.
          </p>
        </div>

        {/* Tier Summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Critical 💐", count: criticalCount, cls: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
            { label: "High ☠", count: highCount, cls: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
            { label: "Standard", count: standardCount, cls: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/20" },
          ].map((t) => (
            <div key={t.label} className={`rounded-xl border p-4 text-center ${t.bg}`}>
              <div className={`text-2xl font-bold ${t.cls}`}>{t.count}</div>
              <div className="text-xs text-muted-foreground mt-1">{t.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search brokers..."
              className="pl-9 bg-input border-border text-foreground"
            />
          </div>
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-40 bg-input border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="critical">Critical 💐</SelectItem>
              <SelectItem value="high">High ☠</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <div className="col-span-3">Site</div>
            <div className="col-span-2">Priority</div>
            <div className="col-span-2">Method</div>
            <div className="col-span-2">Difficulty</div>
            <div className="col-span-2">Data Types</div>
            <div className="col-span-1">Link</div>
          </div>
          <div className="divide-y divide-border">
            {filtered.map((b) => (
              <div key={b.id} className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-secondary/30 transition-colors">
                <div className="col-span-3">
                  <div className="font-medium text-foreground text-sm">{b.name}</div>
                  <div className="text-xs text-muted-foreground">{b.domain}</div>
                </div>
                <div className="col-span-2">
                  <Badge className={`text-xs border ${TIER_CLASSES[b.priorityTier]}`}>
                    {TIER_LABELS[b.priorityTier]}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-muted-foreground capitalize">{b.removalMethod}</span>
                </div>
                <div className="col-span-2">
                  <Badge className={`text-xs border ${DIFFICULTY_CLASSES[b.difficultyRating]}`}>
                    {b.difficultyRating}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <div className="flex flex-wrap gap-1">
                    {((b.dataTypes as string[] | null) ?? []).slice(0, 2).map((dt) => (
                      <span key={dt} className="text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
                        {dt}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="col-span-1">
                  {b.optOutUrl && (
                    <a href={b.optOutUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Wrapper>
  );
}
