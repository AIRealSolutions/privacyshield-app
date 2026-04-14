import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Link2, Plus, ExternalLink, Search } from "lucide-react";
import { useState } from "react";
import { useParams } from "wouter";
import { toast } from "sonner";

const STATUS_CLASSES: Record<string, string> = {
  Pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Submitted: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Confirmed: "bg-green-500/20 text-green-300 border-green-500/30",
  Rejected: "bg-red-500/20 text-red-300 border-red-500/30",
};

export default function DeindexTracker() {
  const params = useParams<{ profileId: string }>();
  const profileId = parseInt(params.profileId || "0");
  const [engine, setEngine] = useState<"google" | "bing">("google");
  const [targetUrl, setTargetUrl] = useState("");
  const [reason, setReason] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: requests, refetch } = trpc.deindex.list.useQuery({ profileId }, { enabled: !!profileId });
  const createRequest = trpc.deindex.create.useMutation({
    onSuccess: () => {
      toast.success("Deindex request created!");
      refetch();
      setTargetUrl("");
      setReason("");
      setShowForm(false);
    },
    onError: (e) => toast.error(e.message),
  });
  const updateStatus = trpc.deindex.updateStatus.useMutation({
    onSuccess: () => { toast.success("Status updated"); refetch(); },
  });

  return (
    <AppLayout title="Search Engine Deindex Tracker">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Search Engine Deindex Tracker</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track Google and Bing deindex requests to remove your personal data from search results.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" /> New Request
          </Button>
        </div>

        {/* New Request Form */}
        {showForm && (
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-foreground text-sm">New Deindex Request</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Search Engine</Label>
                <Select value={engine} onValueChange={(v) => setEngine(v as "google" | "bing")}>
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="bing">Bing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Target URL *</Label>
              <Input
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://example.com/page-with-my-data"
                className="bg-input border-border text-foreground"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Reason</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Personal information removal under CCPA/GDPR"
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => createRequest.mutate({ profileId, engine, targetUrl, reason: reason || undefined })}
                disabled={!targetUrl || createRequest.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Submit Request
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)} className="text-muted-foreground">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Requests List */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <div className="col-span-2">Engine</div>
            <div className="col-span-5">Target URL</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3">Actions</div>
          </div>
          {!requests || requests.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No deindex requests yet. Add URLs you want removed from search results.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {requests.map((r) => (
                <div key={r.id} className="grid grid-cols-12 gap-3 px-4 py-3 items-center">
                  <div className="col-span-2">
                    <Badge className={`text-xs border ${r.engine === "google" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" : "bg-orange-500/20 text-orange-300 border-orange-500/30"}`}>
                      {r.engine === "google" ? "Google" : "Bing"}
                    </Badge>
                  </div>
                  <div className="col-span-5">
                    <div className="text-xs text-foreground truncate">{r.targetUrl}</div>
                    {r.reason && <div className="text-xs text-muted-foreground truncate">{r.reason}</div>}
                  </div>
                  <div className="col-span-2">
                    <Badge className={`text-xs border ${STATUS_CLASSES[r.status ?? "Pending"]}`}>
                      {r.status}
                    </Badge>
                  </div>
                  <div className="col-span-3 flex gap-1">
                    <Select
                      value={r.status ?? "Pending"}
                      onValueChange={(val) => updateStatus.mutate({ id: r.id, status: val as "Pending" | "Submitted" | "Confirmed" | "Rejected" })}
                    >
                      <SelectTrigger className="h-7 text-xs bg-secondary border-border text-foreground w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Submitted">Submitted</SelectItem>
                        <SelectItem value="Confirmed">Confirmed</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <a href={r.targetUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
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
