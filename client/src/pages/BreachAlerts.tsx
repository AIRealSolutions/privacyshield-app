import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Bell, Shield, AlertTriangle, CheckCircle, Search, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function BreachAlerts() {
  const [checkEmail, setCheckEmail] = useState("");
  const [checking, setChecking] = useState(false);

  const { data: alerts, refetch } = trpc.breach.list.useQuery();
  const { data: profiles } = trpc.profile.list.useQuery();

  const checkBreach = trpc.breach.check.useMutation({
    onSuccess: (data) => {
      if (data.found === 0) {
        toast.success("No breaches found for this email address.");
      } else {
        toast.warning(`Found ${data.found} breach${data.found > 1 ? "es" : ""} for this email!`);
      }
      refetch();
      setChecking(false);
    },
    onError: (e) => { toast.error(e.message); setChecking(false); },
  });

  const markRead = trpc.breach.markRead.useMutation({
    onSuccess: () => refetch(),
  });

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkEmail) return;
    setChecking(true);
    checkBreach.mutate({ email: checkEmail, profileId: profiles?.[0]?.id });
  };

  const unread = alerts?.filter((a) => !a.isRead) ?? [];
  const read = alerts?.filter((a) => a.isRead) ?? [];

  return (
    <AppLayout title="Breach Alerts">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Breach Alerts</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Check if your email addresses appear in known data breaches using HaveIBeenPwned.
          </p>
        </div>

        {/* Check Form */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" /> Check Email for Breaches
          </h3>
          <form onSubmit={handleCheck} className="flex gap-3">
            <Input
              type="email"
              value={checkEmail}
              onChange={(e) => setCheckEmail(e.target.value)}
              placeholder="Enter email address to check..."
              className="bg-input border-border text-foreground flex-1"
              required
            />
            <Button
              type="submit"
              disabled={checking}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
            >
              {checking ? "Checking..." : "Check Now"}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">
            Powered by HaveIBeenPwned API. Results are displayed below.
          </p>
        </div>

        {/* Unread Alerts */}
        {unread.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              New Alerts ({unread.length})
            </h3>
            {unread.map((alert) => (
              <div key={alert.id} className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground text-sm">{alert.breachName}</span>
                      {alert.isVerified && (
                        <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">Verified</Badge>
                      )}
                      {alert.isSensitive && (
                        <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs">Sensitive</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {alert.breachDomain && <span className="mr-3">Domain: {alert.breachDomain}</span>}
                      {alert.breachDate && <span>Date: {alert.breachDate}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">Email: {alert.email}</div>
                    {alert.dataClasses && (
                      <div className="flex flex-wrap gap-1">
                        {(alert.dataClasses as string[]).map((dc) => (
                          <span key={dc} className="text-xs bg-red-500/10 text-red-300 px-2 py-0.5 rounded border border-red-500/20">
                            {dc}
                          </span>
                        ))}
                      </div>
                    )}
                    {alert.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{alert.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markRead.mutate({ id: alert.id })}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Read Alerts */}
        {read.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              Previous Alerts ({read.length})
            </h3>
            {read.map((alert) => (
              <div key={alert.id} className="bg-card border border-border rounded-xl p-4 opacity-60">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-foreground text-sm">{alert.breachName}</span>
                    <span className="text-xs text-muted-foreground ml-3">{alert.email}</span>
                    {alert.breachDate && <span className="text-xs text-muted-foreground ml-3">{alert.breachDate}</span>}
                  </div>
                  <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 text-xs">Read</Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {(!alerts || alerts.length === 0) && (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Shield className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">No Breach Alerts</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              No breaches detected yet. Enter your email addresses above to check against the HaveIBeenPwned database.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
