import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Plus, Trash2, User } from "lucide-react";

export default function ProfileSetup() {
  const [, navigate] = useLocation();
  const [fullName, setFullName] = useState("");
  const [aliases, setAliases] = useState<string[]>([""]);
  const [phones, setPhones] = useState<string[]>([""]);
  const [emails, setEmails] = useState<string[]>([""]);
  const [dob, setDob] = useState("");
  const [addresses, setAddresses] = useState([{ street: "", city: "", state: "", zip: "", isCurrent: true }]);

  const createProfile = trpc.profile.create.useMutation({
    onSuccess: () => {
      toast.success("Identity profile created! Starting your initial scan...");
      navigate("/dashboard");
    },
    onError: (e) => toast.error(e.message),
  });

  const addItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) =>
    setter((prev) => [...prev, ""]);
  const removeItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, idx: number) =>
    setter((prev) => prev.filter((_, i) => i !== idx));
  const updateItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, idx: number, val: string) =>
    setter((prev) => prev.map((v, i) => (i === idx ? val : v)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return toast.error("Full name is required");
    createProfile.mutate({
      fullName: fullName.trim(),
      aliases: aliases.filter(Boolean),
      phoneNumbers: phones.filter(Boolean),
      emailAddresses: emails.filter(Boolean),
      dateOfBirth: dob || undefined,
      addresses: addresses.filter((a) => a.city && a.state),
    });
  };

  return (
    <AppLayout title="Create Identity Profile">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Identity Profile Setup</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Enter your personal details so we can scan 148+ data broker sites for your information.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Basic Information
            </h3>
            <div>
              <Label className="text-sm text-muted-foreground mb-1.5 block">Full Legal Name *</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Michael Smith"
                className="bg-input border-border text-foreground"
                required
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground mb-1.5 block">Date of Birth</Label>
              <Input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="bg-input border-border text-foreground"
              />
            </div>
          </div>

          {/* Aliases */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Aliases / Other Names</h3>
            {aliases.map((alias, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={alias}
                  onChange={(e) => updateItem(setAliases, i, e.target.value)}
                  placeholder="e.g. Johnny Smith, J. Smith"
                  className="bg-input border-border text-foreground"
                />
                {aliases.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(setAliases, i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="ghost" size="sm" onClick={() => addItem(setAliases)} className="text-primary">
              <Plus className="h-4 w-4 mr-1" /> Add Alias
            </Button>
          </div>

          {/* Addresses */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-foreground text-sm">Addresses</h3>
            {addresses.map((addr, i) => (
              <div key={i} className="space-y-2 pb-4 border-b border-border last:border-0 last:pb-0">
                <Input
                  value={addr.street}
                  onChange={(e) => setAddresses((prev) => prev.map((a, j) => j === i ? { ...a, street: e.target.value } : a))}
                  placeholder="Street address"
                  className="bg-input border-border text-foreground"
                />
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    value={addr.city}
                    onChange={(e) => setAddresses((prev) => prev.map((a, j) => j === i ? { ...a, city: e.target.value } : a))}
                    placeholder="City"
                    className="bg-input border-border text-foreground"
                  />
                  <Input
                    value={addr.state}
                    onChange={(e) => setAddresses((prev) => prev.map((a, j) => j === i ? { ...a, state: e.target.value } : a))}
                    placeholder="State"
                    className="bg-input border-border text-foreground"
                  />
                  <Input
                    value={addr.zip}
                    onChange={(e) => setAddresses((prev) => prev.map((a, j) => j === i ? { ...a, zip: e.target.value } : a))}
                    placeholder="ZIP"
                    className="bg-input border-border text-foreground"
                  />
                </div>
              </div>
            ))}
            <Button
              type="button" variant="ghost" size="sm"
              onClick={() => setAddresses((prev) => [...prev, { street: "", city: "", state: "", zip: "", isCurrent: false }])}
              className="text-primary"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Address
            </Button>
          </div>

          {/* Phone Numbers */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Phone Numbers</h3>
            {phones.map((phone, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={phone}
                  onChange={(e) => updateItem(setPhones, i, e.target.value)}
                  placeholder="(555) 123-4567"
                  className="bg-input border-border text-foreground"
                />
                {phones.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(setPhones, i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="ghost" size="sm" onClick={() => addItem(setPhones)} className="text-primary">
              <Plus className="h-4 w-4 mr-1" /> Add Phone
            </Button>
          </div>

          {/* Email Addresses */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Email Addresses</h3>
            {emails.map((email, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => updateItem(setEmails, i, e.target.value)}
                  placeholder="john@example.com"
                  className="bg-input border-border text-foreground"
                />
                {emails.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(setEmails, i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="ghost" size="sm" onClick={() => addItem(setEmails)} className="text-primary">
              <Plus className="h-4 w-4 mr-1" /> Add Email
            </Button>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11"
            disabled={createProfile.isPending}
          >
            {createProfile.isPending ? "Creating Profile..." : "Create Profile & Start Scanning"}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
