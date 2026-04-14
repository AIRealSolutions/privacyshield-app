import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { RefreshCw, CheckCircle, AlertTriangle, Clock, Play } from "lucide-react";
import { useParams } from "wouter";
import { toast } from "sonner";
import { useState } from "react";

const STATUS_CLASSES: Record<string, string> = {
  scheduled: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  running: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  completed: "bg-green-500/20 text-green-300 border-green-500/30",
  failed: "bg-red-500/20 text-red-300 border-red-500/30",
};

export default function Monitoring() {
  const params = useParams<{ profileId: string }>();
  const profileId = parseInt(params.profileId || "0");
  const [running, setRunning] = useState(false);

  const { data: jobs, refetch } = trpc.monitoring.jobs.useQuery({ profileId }, { enabled: !!profileId });
  const runWeekly = trpc.monitoring.runWeeklyScan.useMutation({
    onSuccess: (data) => {
      toast.success(`Weekly scan complete! Found ${data.found} exposures across ${data.scanned} sites.`);
      refetch();
      setRunning(false);
    },
    onError: () => { toast.error("Scan failed."); setRunning(false); },
  });

  return (
    <AppLayout title="Weekly Monitoring">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Weekly Monitoring</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Automated re-scans detect re-appearances of previously removed data.</p>
          </div>
          <Button
            size="sm"
            onClick={() => { setRunning(true); runWeekly.mutate({ profileId }); }}
            disabled={running}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {running ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
            {running ? "Running..." : "Run Now"}
          </Button>
        </div>

        {/* Info Card */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <div className="font-medium text-foreground text-sm">Automatic Weekly Scans</div>
              <p className="text-xs text-muted-foreground mt-1">
                PrivacyShield automatically re-scans all 148+ data broker sites every week. When previously removed data re-appears, a new removal request is automatically created and you are notified.
              </p>
            </div>
          </div>
        </div>

        {/* Job History */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-foreground text-sm">Monitoring Job History</h3>
          </div>
          {!jobs || jobs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <RefreshCw className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No monitoring jobs yet. Run your first scan above.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {jobs.map((job) => (
                <div key={job.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground capitalize">
                        {job.jobType.replace(/_/g, " ")}
                      </span>
                      <Badge className={`text-xs border ${STATUS_CLASSES[job.status ?? "scheduled"]}`}>
                        {job.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(job.createdAt).toLocaleString()}
                      {job.sitesScanned ? ` · ${job.sitesScanned} sites scanned` : ""}
                      {job.newFindings ? ` · ${job.newFindings} new findings` : ""}
                      {job.reappearances ? ` · ${job.reappearances} re-appearances` : ""}
                    </div>
                  </div>
                  <div>
                    {job.status === "completed" && <CheckCircle className="h-4 w-4 text-green-400" />}
                    {job.status === "failed" && <AlertTriangle className="h-4 w-4 text-red-400" />}
                    {job.status === "running" && <RefreshCw className="h-4 w-4 text-yellow-400 animate-spin" />}
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
