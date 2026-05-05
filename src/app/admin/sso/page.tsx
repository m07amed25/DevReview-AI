"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownSelect, SelectItem } from "@/components/ui/select";
import { KeyRound, Plus, Pencil, Trash2, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type SsoType = "OIDC" | "SAML";

interface ProviderFormState {
  id?: string;
  name: string;
  type: SsoType;
  enabled: boolean;
  issuer: string;
  clientId: string;
  clientSecret: string;
  entryPoint: string;
  certificate: string;
  emailDomain: string;
}

const EMPTY_FORM: ProviderFormState = {
  name: "",
  type: "OIDC",
  enabled: false,
  issuer: "",
  clientId: "",
  clientSecret: "",
  entryPoint: "",
  certificate: "",
  emailDomain: "",
};

export default function AdminSsoPage() {
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<ProviderFormState>(EMPTY_FORM);

  const { data: providers, isLoading } = trpc.admin.getSsoProviders.useQuery();

  const upsert = trpc.admin.upsertSsoProvider.useMutation({
    onSuccess: () => {
      toast.success(form.id ? "Provider updated" : "Provider created");
      utils.admin.getSsoProviders.invalidate();
      setDialogOpen(false);
      setForm(EMPTY_FORM);
    },
    onError: (e) => toast.error(e.message),
  });

  const remove = trpc.admin.deleteSsoProvider.useMutation({
    onSuccess: () => {
      toast.success("Provider deleted");
      utils.admin.getSsoProviders.invalidate();
      setDeleteId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const openEdit = (p: NonNullable<typeof providers>[number]) => {
    setForm({
      id: p.id,
      name: p.name,
      type: p.type as SsoType,
      enabled: p.enabled,
      issuer: p.issuer ?? "",
      clientId: p.clientId ?? "",
      clientSecret: p.clientSecret ?? "",
      entryPoint: p.entryPoint ?? "",
      certificate: p.certificate ?? "",
      emailDomain: p.emailDomain ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("Provider name is required");
      return;
    }
    upsert.mutate({
      id: form.id,
      name: form.name,
      type: form.type,
      enabled: form.enabled,
      issuer: form.issuer || undefined,
      clientId: form.clientId || undefined,
      clientSecret: form.clientSecret || undefined,
      entryPoint: form.entryPoint || undefined,
      certificate: form.certificate || undefined,
      emailDomain: form.emailDomain || undefined,
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SSO / SAML</h1>
          <p className="text-muted-foreground">
            Configure enterprise Single Sign-On via SAML 2.0 or OIDC for
            centralised identity management.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setForm(EMPTY_FORM);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Provider
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : !providers?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <KeyRound className="h-10 w-10" />
            <p className="text-sm">No SSO providers configured yet.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setForm(EMPTY_FORM);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add your first provider
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {providers.map((p) => (
            <Card key={p.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        {p.emailDomain ? `@${p.emailDomain}` : "All domains"}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.type === "SAML" ? "secondary" : "outline"}>
                      {p.type}
                    </Badge>
                    <Badge variant={p.enabled ? "default" : "destructive"}>
                      {p.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(p)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(p.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {p.issuer && (
                    <span>
                      <span className="font-medium text-foreground">Issuer:</span>{" "}
                      {p.issuer}
                    </span>
                  )}
                  {p.entryPoint && (
                    <span>
                      <span className="font-medium text-foreground">
                        Entry Point:
                      </span>{" "}
                      {p.entryPoint}
                    </span>
                  )}
                  {p.clientId && (
                    <span>
                      <span className="font-medium text-foreground">
                        Client ID:
                      </span>{" "}
                      {p.clientId.slice(0, 12)}…
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Edit SSO Provider" : "New SSO Provider"}
            </DialogTitle>
            <DialogDescription>
              Configure an identity provider for enterprise single sign-on.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="sso-name">Provider name *</Label>
                <Input
                  id="sso-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Okta, Azure AD…"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sso-type">Type</Label>
                <DropdownSelect
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, type: v as SsoType }))
                  }
                  placeholder="Select type"
                >
                  <SelectItem value="OIDC">OIDC</SelectItem>
                  <SelectItem value="SAML">SAML 2.0</SelectItem>
                </DropdownSelect>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sso-domain">Email domain restriction</Label>
              <Input
                id="sso-domain"
                value={form.emailDomain}
                onChange={(e) =>
                  setForm((f) => ({ ...f, emailDomain: e.target.value }))
                }
                placeholder="example.com (leave blank for all domains)"
              />
            </div>

            {form.type === "OIDC" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="sso-issuer">Issuer URL</Label>
                  <Input
                    id="sso-issuer"
                    value={form.issuer}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, issuer: e.target.value }))
                    }
                    placeholder="https://accounts.example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sso-client-id">Client ID</Label>
                  <Input
                    id="sso-client-id"
                    value={form.clientId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, clientId: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sso-client-secret">Client Secret</Label>
                  <Input
                    id="sso-client-secret"
                    type="password"
                    value={form.clientSecret}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, clientSecret: e.target.value }))
                    }
                  />
                </div>
              </>
            )}

            {form.type === "SAML" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="sso-entry">Entry Point (SSO URL)</Label>
                  <Input
                    id="sso-entry"
                    value={form.entryPoint}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, entryPoint: e.target.value }))
                    }
                    placeholder="https://idp.example.com/saml/sso"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sso-cert">IdP Certificate (PEM)</Label>
                  <Textarea
                    id="sso-cert"
                    rows={5}
                    value={form.certificate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, certificate: e.target.value }))
                    }
                    placeholder="-----BEGIN CERTIFICATE-----&#10;…&#10;-----END CERTIFICATE-----"
                    className="font-mono text-xs"
                  />
                </div>
              </>
            )}

            <div className="flex items-center gap-3 pt-1">
              <Switch
                id="sso-enabled"
                checked={form.enabled}
                onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))}
              />
              <Label htmlFor="sso-enabled">Enable this provider</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={upsert.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={upsert.isPending}>
              {upsert.isPending ? "Saving…" : form.id ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete SSO provider?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the provider configuration. Users
              currently authenticated via this provider will be unaffected until
              their sessions expire.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && remove.mutate({ id: deleteId })}
              disabled={remove.isPending}
            >
              {remove.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
