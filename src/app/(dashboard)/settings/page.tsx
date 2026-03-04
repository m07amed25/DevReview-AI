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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
  Moon,
  Monitor,
  Check,
  Code2,
  Shield,
  Trash2,
  Loader2,
  X,
  MonitorSmartphone,
  LogOut,
  AlertTriangle,
  Smartphone,
  Globe,
  Bot,
  Languages,
  FileCode,
  RefreshCw,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────


// ─── Helpers ─────────────────────────────────────────────────────

function parseUserAgent(ua: string | null): {
  browser: string;
  os: string;
  icon: typeof Monitor;
} {
  if (!ua) return { browser: "Unknown", os: "Unknown", icon: Globe };

  let browser = "Unknown Browser";
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";

  let os = "Unknown OS";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  const icon =
    os === "Android" || os === "iOS" ? Smartphone : MonitorSmartphone;

  return { browser, os, icon };
}

function formatRelative(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

// ─── Main Component ──────────────────────────────────────────────
export default function SettingsPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { theme, setTheme } = useTheme();

  // ── Server state ──
  const { data: sessions, isLoading: sessionsLoading } =
    trpc.settings.getSessions.useQuery();

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

  // ── Client state ──
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [showAllSessions, setShowAllSessions] = useState(false);

  // ── Code review preferences (database-backed) ──
  const {
    data: prefs,
    isLoading: prefsLoading,
  } = trpc.settings.getPreferences.useQuery();

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


  // ── Theme change with view-transition ──
  const handleThemeChange = useCallback(
    (newTheme: string, event?: React.MouseEvent) => {
      const x = event?.clientX ?? window.innerWidth / 2;
      const y = event?.clientY ?? 0;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );

      const doc = document as Document & {
        startViewTransition?: (callback: () => void) => {
          ready: Promise<void>;
        };
      };

      if (doc.startViewTransition) {
        const transition = doc.startViewTransition(() => setTheme(newTheme));
        transition.ready.then(() => {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 500,
              easing: "cubic-bezier(0.4, 0, 0.2, 1)",
              pseudoElement: "::view-transition-new(root)",
            },
          );
        });
      } else {
        setTheme(newTheme);
      }
    },
    [setTheme],
  );

  const handleDeleteAccount = () => {
    deleteAccount.mutate({ confirmation: "DELETE" });
  };

  const otherSessions = sessions?.filter((s) => !s.isCurrent) ?? [];
  const SESSION_PREVIEW_COUNT = 3;
  const visibleSessions = showAllSessions
    ? (sessions ?? [])
    : (sessions ?? []).slice(0, SESSION_PREVIEW_COUNT);
  const hiddenCount = (sessions?.length ?? 0) - SESSION_PREVIEW_COUNT;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page Header */}
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

      {/* Toast Messages */}
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
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  id: "light",
                  label: "Light",
                  icon: Sun,
                  desc: "Bright & clean",
                },
                {
                  id: "dark",
                  label: "Dark",
                  icon: Moon,
                  desc: "Easy on the eyes",
                },
                {
                  id: "system",
                  label: "System",
                  icon: Monitor,
                  desc: "Follows your OS",
                },
              ].map((t) => {
                const isActive = theme === t.id;
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={(e) => handleThemeChange(t.id, e)}
                    className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all cursor-pointer hover:shadow-md ${
                      isActive
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-transparent bg-muted/40 hover:bg-muted/60"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-2 right-2">
                        <Check className="size-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`flex items-center justify-center size-10 rounded-lg ${
                        isActive ? "bg-primary/10" : "bg-muted"
                      }`}
                    >
                      <Icon
                        className={`size-5 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                      />
                    </div>
                    <div className="text-center">
                      <p
                        className={`text-sm font-medium ${isActive ? "text-primary" : ""}`}
                      >
                        {t.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {t.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
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
              Configure default behavior for AI-powered code reviews. Synced
              to your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            {prefsLoading || !prefs ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Review Depth */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Review Depth
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        id: "quick" as const,
                        label: "Quick",
                        desc: "Fast overview",
                        icon: RefreshCw,
                      },
                      {
                        id: "standard" as const,
                        label: "Standard",
                        desc: "Balanced analysis",
                        icon: FileCode,
                      },
                      {
                        id: "thorough" as const,
                        label: "Thorough",
                        desc: "Deep inspection",
                        icon: Bot,
                      },
                    ].map((depth) => {
                      const isActive = prefs?.reviewDepth === depth.id;
                      const Icon = depth.icon;
                      return (
                        <button
                          key={depth.id}
                          onClick={() => updatePref("reviewDepth", depth.id)}
                          className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all cursor-pointer ${
                            isActive
                              ? "border-primary bg-primary/5"
                              : "border-transparent bg-muted/40 hover:bg-muted/60"
                          }`}
                        >
                          <Icon
                            className={`size-4 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                          />
                          <span
                            className={`text-xs font-medium ${isActive ? "text-primary" : ""}`}
                          >
                            {depth.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {depth.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Default Language */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center size-8 rounded-md bg-blue-500/10">
                      <Languages className="size-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Default Language</p>
                      <p className="text-xs text-muted-foreground">
                        Primary language for review context
                      </p>
                    </div>
                  </div>
                  <select
                    value={prefs?.defaultLanguage ?? "auto"}
                    onChange={(e) =>
                      updatePref("defaultLanguage", e.target.value)
                    }
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="auto">Auto-detect</option>
                    <option value="typescript">TypeScript</option>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                    <option value="csharp">C#</option>
                    <option value="cpp">C++</option>
                  </select>
                </div>

                <Separator />

                {[
                  {
                    key: "autoReview" as const,
                    label: "Auto-review new PRs",
                    desc: "Automatically trigger a review when a new PR is opened",
                    icon: Bot,
                    color: "text-violet-500 bg-violet-500/10",
                  },
                  {
                    key: "includeSecurityChecks" as const,
                    label: "Security analysis",
                    desc: "Scan for common vulnerabilities and security issues",
                    icon: Shield,
                    color: "text-amber-500 bg-amber-500/10",
                  },
                  {
                    key: "includePerfSuggestions" as const,
                    label: "Performance suggestions",
                    desc: "Highlight potential performance improvements",
                    icon: RefreshCw,
                    color: "text-green-500 bg-green-500/10",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const checked = !!(prefs as Record<string, unknown>)?.[item.key];
                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex items-center justify-center size-8 rounded-md ${item.color}`}
                        >
                          <Icon className="size-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                      <button
                        role="switch"
                        aria-checked={checked}
                        onClick={() => updatePref(item.key, !checked)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                          checked ? "bg-primary" : "bg-muted"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                            checked ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <MonitorSmartphone className="size-4" />
                  Active Sessions
                </CardTitle>
                <CardDescription className="mt-1 flex items-center gap-2">
                  Devices where you&apos;re currently signed in.
                  {sessions && sessions.length > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-normal"
                    >
                      {sessions.length} active
                    </Badge>
                  )}
                </CardDescription>
              </div>
              {otherSessions.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs"
                  onClick={() => revokeAll.mutate()}
                  disabled={revokeAll.isPending}
                >
                  {revokeAll.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <LogOut className="size-3.5" />
                  )}
                  Sign out all others
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pb-6 space-y-3">
            {sessionsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ) : sessions && sessions.length > 0 ? (
              <>
                <div
                  className={`space-y-3 ${
                    showAllSessions && sessions.length > SESSION_PREVIEW_COUNT
                      ? "max-h-105 overflow-y-auto pr-1 scrollbar-thin"
                      : ""
                  }`}
                >
                  {visibleSessions.map((session) => {
                    const {
                      browser,
                      os,
                      icon: DeviceIcon,
                    } = parseUserAgent(session.userAgent);
                    return (
                      <div
                        key={session.id}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                          session.isCurrent
                            ? "bg-primary/5 border-primary/20"
                            : "bg-card"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`flex items-center justify-center size-10 rounded-lg ${
                              session.isCurrent ? "bg-primary/10" : "bg-muted"
                            }`}
                          >
                            <DeviceIcon
                              className={`size-5 ${
                                session.isCurrent
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              }`}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">
                                {browser} on {os}
                              </p>
                              {session.isCurrent && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0 h-4 text-primary bg-primary/10"
                                >
                                  This device
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {session.ipAddress && (
                                <span>{session.ipAddress}</span>
                              )}
                              <span>·</span>
                              <span>
                                Active {formatRelative(session.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {!session.isCurrent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive h-8 w-8 p-0 shrink-0"
                            onClick={() => setRevokeTarget(session.id)}
                            title="Revoke session"
                          >
                            <X className="size-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {hiddenCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground hover:text-foreground gap-2 mt-1"
                    onClick={() => setShowAllSessions(!showAllSessions)}
                  >
                    {showAllSessions ? (
                      <>Show less</>
                    ) : (
                      <>
                        Show {hiddenCount} more session
                        {hiddenCount !== 1 ? "s" : ""}
                      </>
                    )}
                  </Button>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No active sessions found.
              </p>
            )}
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
              This will sign you out of that device. You&apos;ll need to sign in
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

      {/* ═══ Delete Account Confirmation ═══ */}
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
                This action is <strong>permanent and irreversible</strong>. All
                your data will be deleted:
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
              Type <strong>DELETE</strong> to confirm
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
              onClick={handleDeleteAccount}
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
