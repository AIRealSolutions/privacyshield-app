import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Search, ExternalLink, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useParams } from "wouter";
import { toast } from "sonner";

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

export default function ScanResults() {
  const params = useParams<{ profileId: string }>();
  const profileId = parseInt(params.profileId || "0");
  const [filter, setFilter] = useState("");
  const [scanning, setScanning] = useState(false);

  const { data: results, refetch } = trpc.scan.results.useQuery({ profileId }, { enabled: !!profileId });
  const runScan = trpc.scan.run.useMutation({
    onSuccess: (data) => {
      toast.success(`Scan complete! Found ${data.found} exposures.`);
      refetch();
      setScanning(false);
    },
    onError: () => { toast.error("Scan failed."); setScanning(false); },
  });

  const filtered = results?.filter((r) => {
    const name = r.broker?.name?.toLowerCase() ?? "";
    return !filter || name.includes(filter.toLowerCase());
  }) ?? [];

  const foundCount = filtered.filter((r) => r.scan.isPresent).length;

  return (
    <AppLayout title="Scan Results">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Scan Results</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {foundCount} exposures found across {filtered.length} scanned sites
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setScanning(true); runScan.mutate({ profileId, scanType: "manual" }); }}
            disabled={scanning}
            className="border-border text-foreground hover:bg-secondary"
          >
            {scanning ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
            {scanning ? "Scanning..." : "Re-Scan"}
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by site name..."
            className="pl-9 bg-input border-border text-foreground"
          />
        </div>

        {/* Results Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <div className="col-span-4">Site</div>
            <div className="col-span-2">Priority</div>
            <div className="col-span-3">Data Exposed</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">Link</div>
          </div>
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No scan results yet. Run a scan to find your data.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((r) => (
                <div key={r.scan.id} className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-secondary/30 transition-colors">
                  <div className="col-span-4">
                    <div className="font-medium text-foreground text-sm">{r.broker?.name ?? "Unknown"}</div>
                    <div className="text-xs text-muted-foreground">{r.broker?.domain}</div>
                  </div>
                  <div className="col-span-2">
                    <Badge className={`text-xs border ${TIER_CLASSES[r.broker?.priorityTier ?? "standard"]}`}>
                      {TIER_LABELS[r.broker?.priorityTier ?? "standard"]}
                    </Badge>
                  </div>
                  <div className="col-span-3">
                    <div className="flex flex-wrap gap-1">
                      {((r.scan.dataTypesFound as string[] | null) ?? []).slice(0, 3).map((dt) => (
                        <span key={dt} className="text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
                          {dt}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2">
                    {r.scan.isPresent ? (
                      <span className="flex items-center gap-1 text-xs text-red-400">
                        <AlertTriangle className="h-3 w-3" /> Found
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-green-400">
                        <CheckCircle className="h-3 w-3" /> Clear
                      </span>
                    )}
                  </div>
                  <div className="col-span-1">
                    {r.scan.foundUrl && (
                      <a href={r.scan.foundUrl} target="_blank" rel="noopener noreferrer">
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
