"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { trpc } from "@/lib/trpc/client";
import { signOut } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Settings,
  Sun,
  Code2,
  Trash2,
  Loader2,
  LogOut,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import { PreferencesCardContent } from "./preferences-card";
import { SessionsCardContent, SessionsCardHeader } from "./sessions-card";
import { RulesManagerCard } from "@/features/settings/components/rules-manager-card";

import { ThemeTogglerButton } from "@/components/animate-ui/components/buttons/theme-toggler";

export default function SettingsPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { theme, setTheme } = useTheme();

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);

  const { data: sessions, isLoading: sessionsLoading } =
    trpc.settings.getSessions.useQuery();
  const { data: prefs, isLoading: prefsLoading } =
    trpc.settings.getPreferences.useQuery();

  const revokeSession = trpc.settings.revokeSession.useMutation({
    onSuccess: () => {
      void utils.settings.getSessions.invalidate();
      setMessage("Session revoked successfully.");
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (err) => {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    },
  });

  const revokeAll = trpc.settings.revokeAllOtherSessions.useMutation({
    onSuccess: (data) => {
      void utils.settings.getSessions.invalidate();
      setMessage(
        `Revoked ${data.revoked} session${data.revoked !== 1 ? "s" : ""}.`,
      );
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (err) => {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    },
  });

  const deleteAccount = trpc.settings.deleteAccount.useMutation({
    onSuccess: async () => {
      await signOut();
      router.push("/");
    },
    onError: (err) => {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    },
  });

  const updatePreferencesMutation = trpc.settings.updatePreferences.useMutation(
    {
      onSuccess: () => {
        void utils.settings.getPreferences.invalidate();
        setMessage("Preferences saved.");
        setTimeout(() => setMessage(null), 3000);
      },
      onError: (err) => {
        setError(err.message);
        setTimeout(() => setError(null), 5000);
      },
    },
  );

  const updatePref = useCallback(
    (key: string, value: string | boolean) => {
      updatePreferencesMutation.mutate({ [key]: value });
    },
    [updatePreferencesMutation],
  );

  const otherSessions = sessions?.filter((s) => !s.isCurrent) ?? [];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-lg bg-orange-500/10">
            <Settings className="size-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground text-sm">
              Manage your app preferences, sessions, and account.
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
          <Check className="size-4 shrink-0" />
          {message}
        </div>
      )}
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
          <X className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sun className="size-4" />
              Appearance
            </CardTitle>
            <CardDescription>
              Choose how the app looks. Your selection syncs across all tabs.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Switch Appearance</p>
                <p className="text-xs text-muted-foreground">
                  Click the button to cycle through light, dark, and system
                  themes.
                </p>
              </div>
              <ThemeTogglerButton
                variant="outline"
                size="lg"
                className="shrink-0"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Code2 className="size-4" />
              Code Review Preferences
            </CardTitle>
            <CardDescription>
              Configure default behavior for AI-powered code reviews. Synced to
              your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <PreferencesCardContent
              prefs={
                prefs as Parameters<typeof PreferencesCardContent>[0]["prefs"]
              }
              prefsLoading={prefsLoading}
              updatePref={updatePref}
            />
          </CardContent>
        </Card>

        <RulesManagerCard />

        <Card>
          <CardHeader>
            <SessionsCardHeader
              sessions={sessions}
              otherSessions={otherSessions}
              onRevokeAll={() => revokeAll.mutate()}
              revokeAllPending={revokeAll.isPending}
            />
          </CardHeader>
          <CardContent className="pb-6 space-y-3">
            <SessionsCardContent
              sessions={sessions}
              sessionsLoading={sessionsLoading}
              otherSessions={otherSessions}
              onRevokeTarget={setRevokeTarget}
              onRevokeAll={() => revokeAll.mutate()}
              revokeAllPending={revokeAll.isPending}
            />
          </CardContent>
        </Card>

        <Card id="danger-zone" className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-4" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions. Please proceed with caution.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
              <div>
                <p className="text-sm font-medium">Delete Account</p>
                <p className="text-xs text-muted-foreground">
                  Permanently delete your account, repositories, and all review
                  data. This cannot be undone.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="shrink-0 gap-2"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={!!revokeTarget}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign you out of that device. You will need to sign in
              again on that device to use the app.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (revokeTarget) {
                  revokeSession.mutate({ sessionId: revokeTarget });
                  setRevokeTarget(null);
                }
              }}
            >
              {revokeSession.isPending ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <LogOut className="size-4 mr-2" />
              )}
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowDeleteDialog(false);
            setDeleteConfirm("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              Delete your account?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <span>
                This action is permanent and irreversible. All your data will be
                deleted:
              </span>
              <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                <li>Profile and personal information</li>
                <li>Connected repositories</li>
                <li>All code review history</li>
                <li>Connected accounts and sessions</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="delete-confirm" className="text-sm">
              Type DELETE to confirm
            </Label>
            <Input
              id="delete-confirm"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              className="font-mono"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteAccount.mutate({ confirmation: "DELETE" })}
              disabled={deleteConfirm !== "DELETE" || deleteAccount.isPending}
            >
              {deleteAccount.isPending ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="size-4 mr-2" />
              )}
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
