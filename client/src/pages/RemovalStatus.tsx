import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Search, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useParams } from "wouter";
import { toast } from "sonner";

const STATUS_CLASSES: Record<string, string> = {
  Pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Submitted: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Confirmed: "bg-green-500/20 text-green-300 border-green-500/30",
  "Re-appeared": "bg-red-500/20 text-red-300 border-red-500/30",
};

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

export default function RemovalStatus() {
  const params = useParams<{ profileId: string }>();
  const profileId = parseInt(params.profileId || "0");
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: requests, refetch } = trpc.removal.list.useQuery({ profileId }, { enabled: !!profileId });
  const { data: stats } = trpc.removal.stats.useQuery({ profileId }, { enabled: !!profileId });

  const updateStatus = trpc.removal.updateStatus.useMutation({
    onSuccess: () => { toast.success("Status updated"); refetch(); },
    onError: () => toast.error("Failed to update status"),
  });

  const filtered = (requests ?? []).filter((r) => {
    const name = r.broker?.name?.toLowerCase() ?? "";
    const matchesFilter = !filter || name.includes(filter.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.req.status === statusFilter;
    return matchesFilter && matchesStatus;
  });

  return (
    <AppLayout title="Removal Status Board">
      <div className="max-w-5xl mx-auto space-y-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">Removal Status Board</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Track all opt-out and removal requests across data broker sites.</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Pending", value: stats?.pending ?? 0, cls: "text-yellow-400" },
            { label: "Submitted", value: stats?.submitted ?? 0, cls: "text-blue-400" },
            { label: "Confirmed", value: stats?.confirmed ?? 0, cls: "text-green-400" },
            { label: "Re-appeared", value: stats?.reappeared ?? 0, cls: "text-red-400" },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${s.cls}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
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
              placeholder="Filter by site name..."
              className="pl-9 bg-input border-border text-foreground"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-input border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Submitted">Submitted</SelectItem>
              <SelectItem value="Confirmed">Confirmed</SelectItem>
              <SelectItem value="Re-appeared">Re-appeared</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <div className="col-span-4">Site</div>
            <div className="col-span-2">Priority</div>
            <div className="col-span-2">Method</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Actions</div>
          </div>
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <p className="text-sm">No removal requests match your filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((r) => (
                <div key={r.req.id} className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-secondary/30 transition-colors">
                  <div className="col-span-4">
                    <div className="font-medium text-foreground text-sm">{r.broker?.name ?? "Unknown"}</div>
                    <div className="text-xs text-muted-foreground">{r.broker?.domain}</div>
                  </div>
                  <div className="col-span-2">
                    <Badge className={`text-xs border ${TIER_CLASSES[r.broker?.priorityTier ?? "standard"]}`}>
                      {TIER_LABELS[r.broker?.priorityTier ?? "standard"]}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground capitalize">{r.req.submissionMethod}</span>
                  </div>
                  <div className="col-span-2">
                    <Badge className={`text-xs border ${STATUS_CLASSES[r.req.status ?? "Pending"]}`}>
                      {r.req.status}
                    </Badge>
                  </div>
                  <div className="col-span-2 flex gap-1">
                    <Select
                      value={r.req.status ?? "Pending"}
                      onValueChange={(val) =>
                        updateStatus.mutate({
                          id: r.req.id,
                          status: val as "Pending" | "Submitted" | "Confirmed" | "Re-appeared",
                        })
                      }
                    >
                      <SelectTrigger className="h-7 text-xs bg-secondary border-border text-foreground w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Submitted">Submitted</SelectItem>
                        <SelectItem value="Confirmed">Confirmed</SelectItem>
                        <SelectItem value="Re-appeared">Re-appeared</SelectItem>
                      </SelectContent>
                    </Select>
                    {r.broker?.optOutUrl && (
                      <a href={r.broker.optOutUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
