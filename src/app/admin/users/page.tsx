"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ShieldBan,
  ShieldCheck,
  ArrowUp,
  ArrowDown,
  Github,
  KeyRound,
  CreditCard,
  Calendar,
  Layers,
  Users,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { DropdownSelect, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [inputVal, setInputVal] = useState("");

  // Ban dialog state
  const [banTarget, setBanTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [banReason, setBanReason] = useState("");

  // Plan dialog state
  const [planTarget, setPlanTarget] = useState<{
    id: string;
    name: string;
    planId: string;
    expiresAt: string | null;
  } | null>(null);
  const [newPlan, setNewPlan] = useState<string>("free");
  const [newExpiresAt, setNewExpiresAt] = useState<string>("");
  const [overrideRepos, setOverrideRepos] = useState<string>("");
  const [overrideReviews, setOverrideReviews] = useState<string>("");
  const [overrideSeats, setOverrideSeats] = useState<string>("");

  // Bulk selection state
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isBulkPlanDialogOpen, setIsBulkPlanDialogOpen] = useState(false);
  const [isSelectAllMenuOpen, setIsSelectAllMenuOpen] = useState(false);

  const { data, isLoading, refetch } = trpc.admin.getUsers.useQuery({
    page,
    limit: 20,
    search: search || undefined,
  });

  const { data: profile } = trpc.profile.get.useQuery();
  const currentUserIsOwner = profile?.isOwner;

  const deleteUser = trpc.admin.deleteUser.useMutation({
    onSuccess: () => void refetch(),
  });

  const updateRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => void refetch(),
  });

  const updatePlan = trpc.admin.updateUserPlan.useMutation({
    onSuccess: () => {
      setPlanTarget(null);
      toast.success("User plan updated successfully");
      void refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update plan");
    },
  });

  const bulkUpdatePlan = trpc.admin.bulkUpdateUserPlans.useMutation({
    onSuccess: (data) => {
      setIsBulkPlanDialogOpen(false);
      setSelectedUsers([]);
      toast.success(`Updated plans for ${data.count} users`);
      void refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update bulk plans");
    },
  });

  const banUser = trpc.admin.banUser.useMutation({
    onSuccess: () => {
      setBanTarget(null);
      setBanReason("");
      void refetch();
    },
  });

  const unbanUser = trpc.admin.unbanUser.useMutation({
    onSuccess: () => void refetch(),
  });

  const resetPassword = trpc.admin.adminResetUserPassword.useMutation();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(inputVal);
      setPage(1); // Reset to page 1 on new search
    }, 400);

    return () => clearTimeout(timer);
  }, [inputVal]);

  const handleBanConfirm = () => {
    if (!banTarget) return;
    banUser.mutate({ userId: banTarget.id, reason: banReason || undefined });
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            All registered accounts — {data?.total ?? "…"} total
          </p>
        </div>

        {/* Search bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email…"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="pl-9"
            />
          </div>
          {inputVal && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSearch("");
                setInputVal("");
                setPage(1);
              }}
            >
              Clear
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">User List</CardTitle>
            <CardDescription>
              Page {page} of {data?.pages ?? 1}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pb-4">
            {isLoading ? (
              <div className="space-y-px">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-56" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y">
                {/* Header with Select All */}
                <div className="flex items-center gap-4 px-6 py-3 bg-muted/40 border-b">
                  <div className="flex items-center gap-3 relative">
                    <Checkbox
                      checked={
                        selectedUsers.length > 0 &&
                        data?.users.every((u) => selectedUsers.includes(u.id))
                      }
                      onCheckedChange={(checked) => {
                        if (checked) {
                          const currentIds = data?.users.map((u) => u.id) ?? [];
                          setSelectedUsers((prev) =>
                            Array.from(new Set([...prev, ...currentIds])),
                          );
                        } else {
                          const currentIds = data?.users.map((u) => u.id) ?? [];
                          setSelectedUsers((prev) =>
                            prev.filter((id) => !currentIds.includes(id)),
                          );
                        }
                      }}
                    />

                    <div className="group relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[10px] uppercase font-bold text-muted-foreground tracking-wider hover:bg-muted"
                        onClick={() =>
                          setIsSelectAllMenuOpen(!isSelectAllMenuOpen)
                        }
                      >
                        Selection Options
                        <ArrowDown
                          className={`ml-1 h-3 w-3 transition-transform ${isSelectAllMenuOpen ? "rotate-180" : ""}`}
                        />
                      </Button>

                      {isSelectAllMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsSelectAllMenuOpen(false)}
                          />
                          <div className="absolute left-0 mt-2 w-56 z-50 bg-white dark:bg-neutral-900 border rounded-lg shadow-xl py-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
                            <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b mb-1">
                              Bulk Selection
                            </div>
                            <button
                              className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                              onClick={() => {
                                setSelectedUsers(
                                  data?.users.map((u) => u.id) ?? [],
                                );
                                setIsSelectAllMenuOpen(false);
                              }}
                            >
                              <Users className="h-4 w-4 text-neutral-500" />
                              Select all on this page
                            </button>
                            <button
                              className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                              onClick={() => {
                                // For real "Select all in DB", we'd need a special query or handle it on backend.
                                // For now, we simulate by telling the user we're selecting all matching current filters.
                                toast.info(
                                  "Full database selection would happen here. Selecting visible users for now.",
                                );
                                setSelectedUsers(
                                  data?.users.map((u) => u.id) ?? [],
                                );
                                setIsSelectAllMenuOpen(false);
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4 text-indigo-500" />
                              Select all matching filter ({data?.total})
                            </button>

                            <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />
                            <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                              By Tier
                            </div>
                            <button
                              className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                              onClick={() => {
                                const ids =
                                  data?.users
                                    .filter((u) => u.planId === "free")
                                    .map((u) => u.id) ?? [];
                                setSelectedUsers(ids);
                                setIsSelectAllMenuOpen(false);
                              }}
                            >
                              <div className="w-2 h-2 rounded-full bg-neutral-400" />
                              Select all Free users
                            </button>
                            <button
                              className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                              onClick={() => {
                                const ids =
                                  data?.users
                                    .filter((u) => u.planId === "pro")
                                    .map((u) => u.id) ?? [];
                                setSelectedUsers(ids);
                                setIsSelectAllMenuOpen(false);
                              }}
                            >
                              <div className="w-2 h-2 rounded-full bg-indigo-500" />
                              Select all Pro users
                            </button>
                            <button
                              className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                              onClick={() => {
                                const ids =
                                  data?.users
                                    .filter((u) => u.planId === "ultra")
                                    .map((u) => u.id) ?? [];
                                setSelectedUsers(ids);
                                setIsSelectAllMenuOpen(false);
                              }}
                            >
                              <div className="w-2 h-2 rounded-full bg-violet-600" />
                              Select all Ultra users
                            </button>

                            <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />
                            <button
                              className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 dark:hover:bg-red-900/20 flex items-center gap-2"
                              onClick={() => {
                                setSelectedUsers([]);
                                setIsSelectAllMenuOpen(false);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              Clear selection
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {data?.users.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900/40 ${
                      user.banned ? "bg-amber-500/5" : ""
                    }`}
                  >
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(
                            selectedUsers.filter((id) => id !== user.id),
                          );
                        }
                      }}
                    />
                    <Avatar className="h-9 w-9 shrink-0">
                      {user.image && (
                        <AvatarImage src={user.image} alt={user.name ?? ""} />
                      )}
                      <AvatarFallback>
                        {(user.name ?? user.email).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">
                          {user.name ?? "(no name)"}
                        </span>

                        {/* Role badge */}
                        {user.isOwner ? (
                          <Badge
                            variant="default"
                            className="border-amber-500 bg-amber-500/15 text-amber-500"
                          >
                            Owner
                          </Badge>
                        ) : (
                          <Badge
                            variant={
                              user.role === "ADMIN" ? "default" : "outline"
                            }
                            className={
                              user.role === "ADMIN"
                                ? "border-violet-500 bg-violet-500/15 text-violet-400"
                                : "text-xs"
                            }
                          >
                            {user.role === "ADMIN" ? "Admin" : "User"}
                          </Badge>
                        )}

                        {user.banned && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="outline"
                                className="border-amber-500 bg-amber-500/10 text-amber-500 text-xs cursor-default"
                              >
                                Banned
                              </Badge>
                            </TooltipTrigger>
                            {user.bannedReason && (
                              <TooltipContent side="top">
                                <p className="max-w-xs text-xs">
                                  Reason: {user.bannedReason}
                                </p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        )}

                        {user.emailVerified && (
                          <Badge variant="outline" className="text-xs">
                            Verified
                          </Badge>
                        )}

                        {user.githubConnected && (
                          <Badge
                            variant="outline"
                            className="gap-1 border-neutral-500 bg-neutral-500/10 text-xs text-neutral-400"
                          >
                            <Github className="h-3 w-3" />
                            GitHub
                          </Badge>
                        )}

                        <Badge
                          variant="secondary"
                          className={`text-[10px] h-5 px-1.5 font-normal ${
                            user.planId === "ultra"
                              ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
                              : user.planId === "pro"
                                ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
                                : "bg-neutral-500/10 text-neutral-500 border-neutral-500/20"
                          }`}
                        >
                          {user.planId.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>

                    <div className="hidden gap-6 text-center text-sm sm:flex">
                      <div>
                        <p className="font-medium">
                          {user._count.repositories}
                        </p>
                        <p className="text-xs text-muted-foreground">Repos</p>
                      </div>
                      <div>
                        <p className="font-medium">{user._count.reviews}</p>
                        <p className="text-xs text-muted-foreground">Reviews</p>
                      </div>
                      <div>
                        <p className="font-medium">{user._count.teamMembers}</p>
                        <p className="text-xs text-muted-foreground">Teams</p>
                      </div>
                    </div>

                    <span className="hidden text-xs text-muted-foreground lg:block">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>

                    {/* Promote / Demote */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant={
                            user.role === "ADMIN" ? "outline" : "default"
                          }
                          size="sm"
                          className={`h-8 shrink-0 gap-1.5 text-xs ${
                            user.role === "ADMIN"
                              ? "text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                              : "bg-violet-600 text-white hover:bg-violet-700"
                          }`}
                          disabled={
                            updateRole.isPending ||
                            (user.isOwner && !currentUserIsOwner)
                          }
                        >
                          {user.role === "ADMIN" ? (
                            <>
                              <ArrowDown className="h-3 w-3" />
                              Demote
                            </>
                          ) : (
                            <>
                              <ArrowUp className="h-3 w-3" />
                              Promote
                            </>
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {user.role === "ADMIN"
                              ? "Demote to User?"
                              : "Promote to Admin?"}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {user.role === "ADMIN"
                              ? `Remove admin privileges from ${user.name ?? user.email}. They will lose access to the admin panel.`
                              : `Grant admin privileges to ${user.name ?? user.email}. They will have full access to the admin panel.`}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              updateRole.mutate({
                                userId: user.id,
                                role: user.role === "ADMIN" ? "USER" : "ADMIN",
                              })
                            }
                          >
                            {user.role === "ADMIN" ? "Demote" : "Promote"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    {/* Ban / Unban */}
                    {user.banned ? (
                      /* ── Unban ── */
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="shrink-0 text-amber-500 border-amber-500/40 hover:bg-amber-500/10"
                            disabled={
                              unbanUser.isPending ||
                              (user.isOwner && !currentUserIsOwner)
                            }
                            title="Unban user"
                          >
                            <ShieldCheck className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Unban user?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Restore access for{" "}
                              <strong>{user.name ?? user.email}</strong>. They
                              will be able to sign in again.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                unbanUser.mutate({ userId: user.id })
                              }
                            >
                              Unban
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      /* ── Ban ── */
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-amber-500 hover:bg-amber-500/10"
                        disabled={
                          banUser.isPending ||
                          (user.isOwner && !currentUserIsOwner)
                        }
                        title="Ban user"
                        onClick={() =>
                          setBanTarget({
                            id: user.id,
                            name: user.name ?? user.email,
                          })
                        }
                      >
                        <ShieldBan className="h-4 w-4" />
                      </Button>
                    )}

                    {/* Manage Plan */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-indigo-500 hover:bg-indigo-500/10"
                      disabled={
                        updatePlan.isPending ||
                        (user.isOwner && !currentUserIsOwner)
                      }
                      title="Manage plan"
                      onClick={() => {
                        setPlanTarget({
                          id: user.id,
                          name: user.name ?? user.email,
                          planId: user.planId,
                          expiresAt: user.planExpiresAt
                            ? new Date(user.planExpiresAt)
                                .toISOString()
                                .split("T")[0]
                            : null,
                        });
                        setNewPlan(user.planId);
                        setNewExpiresAt(
                          user.planExpiresAt
                            ? new Date(user.planExpiresAt)
                                .toISOString()
                                .split("T")[0]
                            : "",
                        );
                      }}
                    >
                      <CreditCard className="h-4 w-4" />
                    </Button>

                    {/* Reset Password */}
                    <AlertDialog>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="shrink-0 text-muted-foreground hover:bg-orange-100 hover:text-orange-600 dark:hover:bg-orange-950/50 dark:hover:text-orange-400"
                              disabled={
                                resetPassword.isPending ||
                                (user.isOwner && !currentUserIsOwner)
                              }
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                          Send password reset email
                        </TooltipContent>
                      </Tooltip>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reset password?</AlertDialogTitle>
                          <AlertDialogDescription>
                            A password reset link will be sent to{" "}
                            <strong>{user.email}</strong>. The user will need to
                            follow the link to set a new password.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              resetPassword.mutate({ userId: user.id })
                            }
                          >
                            Send Reset Link
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    {/* Delete */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-destructive hover:bg-destructive/10"
                          disabled={
                            deleteUser.isPending ||
                            (user.isOwner && !currentUserIsOwner)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete user?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete{" "}
                            <strong>{user.name ?? user.email}</strong> and all
                            their data (repositories, reviews, team
                            memberships). This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() =>
                              deleteUser.mutate({ userId: user.id })
                            }
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}

                {data?.users.length === 0 && (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No users found.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} / {data.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === data.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Ban reason dialog (shared, rendered once) */}
        <Dialog
          open={!!banTarget}
          onOpenChange={(open) => {
            if (!open) {
              setBanTarget(null);
              setBanReason("");
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ban {banTarget?.name}?</DialogTitle>
              <DialogDescription>
                This will immediately revoke all active sessions and prevent
                them from signing in. You can optionally provide a reason.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="ban-reason">Reason (optional)</Label>
              <Textarea
                id="ban-reason"
                placeholder="e.g. Violated terms of service"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setBanTarget(null);
                  setBanReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="bg-amber-600 hover:bg-amber-700"
                onClick={handleBanConfirm}
                disabled={banUser.isPending}
              >
                {banUser.isPending ? "Banning…" : "Ban User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Plan Management Dialog */}
        <Dialog
          open={!!planTarget}
          onOpenChange={(open) => {
            if (!open) setPlanTarget(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage Plan for {planTarget?.name}</DialogTitle>
              <DialogDescription>
                Change the user&apos;s subscription plan and expiration date.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Subscription Plan</Label>
                <DropdownSelect
                  value={newPlan}
                  onValueChange={(val) => setNewPlan(val)}
                  placeholder="Select a plan"
                >
                  <SelectItem value="free">Free Plan</SelectItem>
                  <SelectItem value="pro">Pro Plan</SelectItem>
                  <SelectItem value="ultra">Ultra Plan</SelectItem>
                </DropdownSelect>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Repo Limit Override</Label>
                  <Input
                    type="number"
                    placeholder="Plan default"
                    value={overrideRepos}
                    onChange={(e) => setOverrideRepos(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Review Limit Override</Label>
                  <Input
                    type="number"
                    placeholder="Plan default"
                    value={overrideReviews}
                    onChange={(e) => setOverrideReviews(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Seat Limit Override</Label>
                <Input
                  type="number"
                  placeholder="Plan default"
                  value={overrideSeats}
                  onChange={(e) => setOverrideSeats(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Expiration Date (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={newExpiresAt}
                    onChange={(e) => setNewExpiresAt(e.target.value)}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Leave empty for perpetual access.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPlanTarget(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!planTarget) return;
                  updatePlan.mutate({
                    userId: planTarget.id,
                    planId: newPlan as any,
                    expiresAt: newExpiresAt ? new Date(newExpiresAt) : null,
                    overrideReposLimit: overrideRepos
                      ? parseInt(overrideRepos)
                      : null,
                    overrideReviewsLimit: overrideReviews
                      ? parseInt(overrideReviews)
                      : null,
                    overrideSeatsLimit: overrideSeats
                      ? parseInt(overrideSeats)
                      : null,
                  });
                }}
                disabled={updatePlan.isPending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {updatePlan.isPending ? "Updating…" : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Plan Dialog */}
        <Dialog
          open={isBulkPlanDialogOpen}
          onOpenChange={setIsBulkPlanDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
                <Layers className="h-6 w-6 text-indigo-600" />
              </div>
              <DialogTitle className="text-xl">Bulk Update Plans</DialogTitle>
              <DialogDescription className="text-base">
                You are about to update the subscription status for{" "}
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {selectedUsers.length}
                </span>{" "}
                selected users.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-6">
              <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  This action will immediately change the service level and
                  trigger automated notification emails to all selected users.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    New Subscription Plan
                  </Label>
                  <DropdownSelect value={newPlan} onValueChange={setNewPlan}>
                    <SelectItem value="free">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-neutral-400" />
                        <span>Free Plan</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="pro">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span>Pro Plan</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="ultra">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-violet-600" />
                        <span>Ultra Plan</span>
                      </div>
                    </SelectItem>
                  </DropdownSelect>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    Expiration Date (Optional)
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      className="pl-9"
                      value={newExpiresAt}
                      onChange={(e) => setNewExpiresAt(e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">
                    Leave blank for lifetime access or plan-default behavior.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsBulkPlanDialogOpen(false)}
                className="rounded-xl px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  bulkUpdatePlan.mutate({
                    userIds: selectedUsers,
                    planId: newPlan as any,
                    expiresAt: newExpiresAt ? new Date(newExpiresAt) : null,
                  });
                }}
                disabled={bulkUpdatePlan.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-8 shadow-lg shadow-indigo-500/20"
              >
                {bulkUpdatePlan.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  "Update All Users"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Action Bar */}
        <AnimatePresence>
          {selectedUsers.length > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full shadow-2xl shadow-indigo-500/10"
            >
              <span className="text-sm font-medium">
                {selectedUsers.length} users selected
              </span>
              <Separator orientation="vertical" className="h-4" />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsBulkPlanDialogOpen(true)}
                className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Change Plan
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedUsers([])}
                className="text-neutral-500 hover:text-neutral-700"
              >
                Clear Selection
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}
