"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminSettingsPage() {
  const utils = trpc.useUtils();
  const { data: settings, isLoading } = trpc.admin.getSystemSettings.useQuery();
  const { data: retention, isLoading: retentionLoading } =
    trpc.admin.getRetentionSettings.useQuery();

  const [reviewDays, setReviewDays] = useState("");
  const [auditDays, setAuditDays] = useState("");
  const [sessionDays, setSessionDays] = useState("");

  useEffect(() => {
    if (retention) {
      setReviewDays(String(retention.reviewRetentionDays));
      setAuditDays(String(retention.auditLogRetentionDays));
      setSessionDays(String(retention.sessionRetentionDays));
    }
  }, [retention]);

  const updateMutation = trpc.admin.updateSystemSettings.useMutation({
    onSuccess: () => {
      toast.success("Settings updated successfully");
      utils.admin.getSystemSettings.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update settings");
    },
  });

  const retentionMutation = trpc.admin.updateRetentionSettings.useMutation({
    onSuccess: () => {
      toast.success("Retention policy saved");
      utils.admin.getRetentionSettings.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleMaintenanceToggle = (checked: boolean) => {
    updateMutation.mutate({ maintenanceMode: checked });
  };

  const handleRetentionSave = () => {
    const parse = (v: string, fallback: number) => {
      const n = parseInt(v, 10);
      return isNaN(n) || n < 0 ? fallback : n;
    };
    retentionMutation.mutate({
      reviewRetentionDays: parse(reviewDays, 0),
      auditLogRetentionDays: parse(auditDays, 0),
      sessionRetentionDays: parse(sessionDays, 0),
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">
          Configure global application behavior and integrations.
        </p>
      </div>

      <div className="grid gap-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>General Configuration</CardTitle>
            <CardDescription>
              Basic settings for your deployment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pb-4">
            <div className="space-y-2 opacity-50">
              <Label htmlFor="siteName">Platform Name</Label>
              <Input id="siteName" defaultValue="Code Catch" disabled />
              <p className="text-[10px] text-muted-foreground italic">
                Name configuration is currently locked to project defaults.
              </p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div className="space-y-0.5">
                <Label className="text-base">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground italic">
                  When active, non-admin users will be redirected to the
                  maintenance page.
                </p>
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-10 rounded-full" />
              ) : (
                <Switch
                  checked={settings?.maintenanceMode ?? false}
                  onCheckedChange={handleMaintenanceToggle}
                  disabled={updateMutation.isPending}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Data Retention ───────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Data Retention Policies</CardTitle>
            <CardDescription>
              Automatically purge old records to comply with data residency
              requirements. Set to{" "}
              <span className="font-semibold text-foreground">0</span> to keep
              data indefinitely.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pb-6">
            {retentionLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="ret-reviews">Reviews (days)</Label>
                    <Input
                      id="ret-reviews"
                      type="number"
                      min={0}
                      max={3650}
                      value={reviewDays}
                      onChange={(e) => setReviewDays(e.target.value)}
                      placeholder="0 = keep forever"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Completed and failed reviews older than N days
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ret-audit">Audit logs (days)</Label>
                    <Input
                      id="ret-audit"
                      type="number"
                      min={0}
                      max={3650}
                      value={auditDays}
                      onChange={(e) => setAuditDays(e.target.value)}
                      placeholder="0 = keep forever"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Admin audit events older than N days
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ret-sessions">Sessions (days)</Label>
                    <Input
                      id="ret-sessions"
                      type="number"
                      min={0}
                      max={365}
                      value={sessionDays}
                      onChange={(e) => setSessionDays(e.target.value)}
                      placeholder="0 = keep forever"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Expired user sessions older than N days
                    </p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleRetentionSave}
                    disabled={retentionMutation.isPending}
                    size="sm"
                  >
                    {retentionMutation.isPending
                      ? "Saving…"
                      : "Save retention policy"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
