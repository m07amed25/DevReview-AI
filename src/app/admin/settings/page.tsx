"use client";

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
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminSettingsPage() {
  const utils = trpc.useUtils();
  const { data: settings, isLoading } = trpc.admin.getSystemSettings.useQuery();

  const updateMutation = trpc.admin.updateSystemSettings.useMutation({
    onSuccess: () => {
      toast.success("Settings updated successfully");
      utils.admin.getSystemSettings.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update settings");
    },
  });

  const handleMaintenanceToggle = (checked: boolean) => {
    updateMutation.mutate({ maintenanceMode: checked });
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
              <Input id="siteName" defaultValue="DevReview AI" disabled />
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
      </div>
    </div>
  );
}
