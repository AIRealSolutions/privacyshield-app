import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Bot, Copy, Mail, FileText, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

const REQUEST_TYPES = [
  { value: "opt_out_email", label: "Opt-Out Email Template", icon: Mail, desc: "Generate a professional opt-out email to send to a data broker." },
  { value: "gdpr_ccpa_letter", label: "GDPR/CCPA Removal Letter", icon: FileText, desc: "Draft a formal legal removal request citing GDPR Article 17 or CCPA Section 1798.105." },
  { value: "manual_guidance", label: "Manual Removal Guide", icon: BookOpen, desc: "Get step-by-step instructions for sites that require manual removal (calls, ID submission, etc.)." },
];

export default function LlmAssistant() {
  const [requestType, setRequestType] = useState<"opt_out_email" | "gdpr_ccpa_letter" | "manual_guidance">("opt_out_email");
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>("");
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileAddress, setProfileAddress] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<number | null>(null);

  const { data: brokers } = trpc.broker.list.useQuery({});
  const { data: history, refetch: refetchHistory } = trpc.llm.history.useQuery();

  const generate = trpc.llm.generate.useMutation({
    onSuccess: (data) => {
      setResult(data.content);
      refetchHistory();
      toast.success("Content generated successfully!");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleGenerate = () => {
    generate.mutate({
      requestType,
      brokerId: selectedBrokerId ? parseInt(selectedBrokerId) : undefined,
      profileName: profileName || undefined,
      profileEmail: profileEmail || undefined,
      profileAddress: profileAddress || undefined,
    });
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      toast.success("Copied to clipboard!");
    }
  };

  const selectedType = REQUEST_TYPES.find((t) => t.value === requestType);

  return (
    <AppLayout title="AI Opt-Out Assistant">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">AI Opt-Out Assistant</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Generate personalized opt-out emails, GDPR/CCPA letters, and manual removal guides tailored to each data broker.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <div className="space-y-4">
            {/* Request Type */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" /> What do you need?
              </h3>
              <div className="space-y-2">
                {REQUEST_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setRequestType(t.value as typeof requestType)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      requestType === t.value
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <t.icon className="h-4 w-4" />
                      <span className="font-medium text-sm">{t.label}</span>
                    </div>
                    <p className="text-xs opacity-80">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Data Broker Selection */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Target Data Broker (Optional)</h3>
              <Select value={selectedBrokerId} onValueChange={setSelectedBrokerId}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder="Select a data broker..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border max-h-60">
                  <SelectItem value="0">General (no specific broker)</SelectItem>
                  {brokers?.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Personal Info */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Your Information (Optional)</h3>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Full Name</Label>
                <Input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="John Smith"
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Email Address</Label>
                <Input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Address</Label>
                <Input
                  value={profileAddress}
                  onChange={(e) => setProfileAddress(e.target.value)}
                  placeholder="123 Main St, City, State 12345"
                  className="bg-input border-border text-foreground"
                />
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generate.isPending}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11"
            >
              {generate.isPending ? (
                <>
                  <Bot className="h-4 w-4 mr-2 animate-pulse" />
                  Generating...
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4 mr-2" />
                  Generate {selectedType?.label}
                </>
              )}
            </Button>
          </div>

          {/* Result Panel */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-5 min-h-80">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground text-sm">Generated Content</h3>
                {result && (
                  <Button variant="ghost" size="sm" onClick={copyToClipboard} className="text-muted-foreground hover:text-foreground">
                    <Copy className="h-4 w-4 mr-1" /> Copy
                  </Button>
                )}
              </div>
              {result ? (
                <div className="prose prose-sm prose-invert max-w-none text-foreground">
                  <Streamdown>{result}</Streamdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-60 text-center">
                  <Bot className="h-10 w-10 text-muted-foreground mb-3 opacity-40" />
                  <p className="text-sm text-muted-foreground">
                    Configure your request on the left and click Generate to create personalized removal content.
                  </p>
                </div>
              )}
            </div>

            {/* History */}
            {history && history.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground text-sm mb-3">Recent Generations</h3>
                <div className="space-y-2">
                  {history.slice(0, 5).map((h) => (
                    <div key={h.id} className="border border-border rounded-lg overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between p-3 text-left hover:bg-secondary/30 transition-colors"
                        onClick={() => setExpandedHistory(expandedHistory === h.id ? null : h.id)}
                      >
                        <div>
                          <span className="text-sm font-medium text-foreground capitalize">
                            {h.requestType.replace(/_/g, " ")}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {new Date(h.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {expandedHistory === h.id ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      {expandedHistory === h.id && (
                        <div className="px-3 pb-3 border-t border-border">
                          <div className="prose prose-sm prose-invert max-w-none text-foreground mt-2 text-xs">
                            <Streamdown>{h.generatedContent}</Streamdown>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(h.generatedContent ?? "");
                              toast.success("Copied!");
                            }}
            className="text-muted-foreground hover:text-foreground mt-2"
          >
            <Copy className="h-3.5 w-3.5 mr-1" /> Copy
          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
