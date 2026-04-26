"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
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
} from "lucide-react";

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

  const { data, isLoading, refetch } = trpc.admin.getUsers.useQuery({
    page,
    limit: 20,
    search: search || undefined,
  });

  const deleteUser = trpc.admin.deleteUser.useMutation({
    onSuccess: () => void refetch(),
  });

  const updateRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => void refetch(),
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
                {data?.users.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-4 px-6 py-4 ${
                      user.banned ? "bg-amber-500/5" : ""
                    }`}
                  >
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
                          disabled={updateRole.isPending || user.isOwner}
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
                            disabled={unbanUser.isPending || user.isOwner}
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
                        disabled={banUser.isPending || user.isOwner}
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

                    {/* Delete */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-destructive hover:bg-destructive/10"
                          disabled={deleteUser.isPending || user.isOwner}
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
      </div>
    </TooltipProvider>
  );
}
