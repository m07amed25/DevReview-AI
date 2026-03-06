"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  UserPlus,
  FolderGit2,
  Crown,
  Shield,
  User,
  MoreVertical,
  Trash2,
  ArrowLeft,
  Share2,
  Unlink,
  AlertTriangle,
  Clock,
  Check,
  X,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const roleIcon = { OWNER: Crown, ADMIN: Shield, MEMBER: User } as const;
const roleColor = {
  OWNER: "text-amber-500",
  ADMIN: "text-blue-500",
  MEMBER: "text-muted-foreground",
} as const;

// Format action type to readable text
function formatActionType(type: string): string {
  return type
    .replace("_", " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

export default function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const router = useRouter();

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"MEMBER" | "ADMIN">("MEMBER");
  const [inviting, setInviting] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const team = trpc.team.get.useQuery({ teamId });
  const myRepos = trpc.repository.list.useQuery();
  const pendingActions = trpc.team.getPendingActions.useQuery({ teamId });
  const myRequests = trpc.team.getMyRequestedActions.useQuery({ teamId });
  const utils = trpc.useUtils();

  const [requestActionDialogOpen, setRequestActionDialogOpen] = useState(false);
  const [selectedActionType, setSelectedActionType] = useState<string>("");

  const inviteMember = trpc.team.inviteMember.useMutation({
    onSuccess: () => {
      setInviteEmail("");
      setInviting(false);
      utils.team.get.invalidate({ teamId });
    },
    onError: (err) => setError(err.message),
  });

  const requestAction = trpc.team.requestAction.useMutation({
    onSuccess: (data) => {
      if (data.requiresApproval) {
        setError("Your request has been submitted for approval.");
      }
      utils.team.getPendingActions.invalidate({ teamId });
      utils.team.get.invalidate({ teamId });
    },
    onError: (err) => setError(err.message),
  });

  const approveAction = trpc.team.approveAction.useMutation({
    onSuccess: () => {
      utils.team.getPendingActions.invalidate({ teamId });
      utils.team.get.invalidate({ teamId });
    },
    onError: (err) => setError(err.message),
  });

  const rejectAction = trpc.team.rejectAction.useMutation({
    onSuccess: () => {
      utils.team.getPendingActions.invalidate({ teamId });
    },
    onError: (err) => setError(err.message),
  });

  const updateRole = trpc.team.updateMemberRole.useMutation({
    onSuccess: () => utils.team.get.invalidate({ teamId }),
    onError: (err) => setError(err.message),
  });

  const removeMember = trpc.team.removeMember.useMutation({
    onSuccess: () => utils.team.get.invalidate({ teamId }),
    onError: (err) => setError(err.message),
  });

  const shareRepo = trpc.team.shareRepository.useMutation({
    onSuccess: () => {
      setShareDialogOpen(false);
      utils.team.get.invalidate({ teamId });
      utils.repository.list.invalidate();
    },
    onError: (err) => setError(err.message),
  });

  const unshareRepo = trpc.team.unshareRepository.useMutation({
    onSuccess: () => {
      utils.team.get.invalidate({ teamId });
      utils.repository.list.invalidate();
    },
    onError: (err) => setError(err.message),
  });

  const deleteTeam = trpc.team.delete.useMutation({
    onSuccess: () => router.push("/teams"),
    onError: (err) => setError(err.message),
  });

  const isOwnerOrAdmin =
    team.data?.currentUserRole === "OWNER" ||
    team.data?.currentUserRole === "ADMIN";
  const isOwner = team.data?.currentUserRole === "OWNER";

  // Repos the user owns that aren't already shared with THIS team
  const sharableRepos =
    myRepos.data?.filter(
      (r) => !r.team || r.team.id !== teamId,
    ) ?? [];

  if (team.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!team.data) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Team not found</p>
        <Link href="/teams">
          <Button variant="ghost" className="mt-4">
            <ArrowLeft className="size-4 mr-2" /> Back to teams
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      {/* Abstract Background Pattern */}
      <div className="pointer-events-none absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-50"></div>

      <div className="space-y-8 max-w-6xl mx-auto pb-12 pt-4 px-4 sm:px-6 lg:px-8">
      {/* Error dialog */}
      <AlertDialog open={!!error} onOpenChange={() => setError(null)}>
        <AlertDialogContent className="border-destructive/20 bg-card/95 backdrop-blur-xl shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="size-5" />
              Error
            </AlertDialogTitle>
            <AlertDialogDescription>{error}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setError(null)}>
              Dismiss
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex items-center gap-4">
          <Link href="/teams">
            <Button variant="ghost" size="icon" className="group rounded-full bg-muted/30 hover:bg-muted/60 transition-colors">
              <ArrowLeft className="size-5 text-muted-foreground group-hover:text-foreground transition-colors group-hover:-translate-x-0.5 duration-300" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-primary font-bold text-2xl shadow-inner border border-primary/10">
              {team.data.name!.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {team.data.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 items-center bg-muted/50 rounded flex gap-1 font-medium font-mono text-muted-foreground">
                  /{team.data.slug}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        {isOwner && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setConfirmDelete(true)}
            className="shadow-sm hover:shadow-md transition-all duration-300 self-start sm:self-auto"
          >
            <Trash2 className="size-4 mr-2" />
            Delete Team
          </Button>
        )}
      </div>

      {/* Delete confirm */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              Delete team?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all members and unlink shared repositories. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setConfirmDelete(false)}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              Cancel
            </AlertDialogAction>
            <Button
              variant="destructive"
              onClick={() => deleteTeam.mutate({ teamId })}
              disabled={deleteTeam.isPending}
            >
              {deleteTeam.isPending ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pending Actions Section - Only visible to admins/owners */}
      {isOwnerOrAdmin && (
        <Card className="border-amber-500/30 shadow-sm bg-card/60 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/40">
            <div>
              <CardTitle className="text-lg flex items-center gap-2 font-semibold">
                <div className="p-1.5 rounded-md bg-amber-500/10">
                  <Clock className="size-4 text-amber-500" />
                </div>
                Pending Approvals
              </CardTitle>
              <CardDescription className="mt-1.5">
                {(pendingActions.data?.length ?? 0)} action
                {(pendingActions.data?.length ?? 0) !== 1 ? "s" : ""} awaiting approval
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            {pendingActions.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : !pendingActions.data || pendingActions.data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="size-10 rounded-full bg-muted flex items-center justify-center mb-3">
                  <ClipboardList className="size-5 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-foreground">No pending approvals</p>
                <p className="text-xs text-muted-foreground mt-1">
                  All action requests have been processed
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingActions.data?.map((action) => (
                  <div
                    key={action.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-amber-500/5 border border-amber-500/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-amber-500/10">
                        <Clock className="size-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {formatActionType(action.actionType)}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Requested by user • {new Date(action.createdAt).toLocaleDateString()}
                        </p>
                        {action.metadata && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {JSON.stringify(action.metadata)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-green-600 hover:text-green-700 hover:bg-green-600/10"
                        onClick={() => approveAction.mutate({ actionId: action.id })}
                        disabled={approveAction.isPending}
                        title="Approve"
                      >
                        <Check className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => rejectAction.mutate({ actionId: action.id })}
                        disabled={rejectAction.isPending}
                        title="Reject"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* My Requests Section - Visible to all team members */}
      <Card className="border-border/40 shadow-sm bg-card/60 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/40">
          <div>
            <CardTitle className="text-lg flex items-center gap-2 font-semibold">
              <div className="p-1.5 rounded-md bg-blue-500/10">
                <ClipboardList className="size-4 text-blue-500" />
              </div>
              My Requests
            </CardTitle>
            <CardDescription className="mt-1.5">
              {(myRequests.data?.length ?? 0)} of your request
              {(myRequests.data?.length ?? 0) !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          {!isOwnerOrAdmin && (
            <Button 
              size="sm" 
              onClick={() => setRequestActionDialogOpen(true)} 
              className="shadow-sm hover:translate-y-[-1px] transition-transform"
            >
              <UserPlus className="size-4 mr-2" />
              Request Action
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-3">
          {myRequests.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
            </div>
          ) : !myRequests.data || myRequests.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="size-10 rounded-full bg-muted flex items-center justify-center mb-3">
                <ClipboardList className="size-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-foreground">No pending requests</p>
              <p className="text-xs text-muted-foreground mt-1">
                {isOwnerOrAdmin 
                  ? "You don't have any pending action requests"
                  : "Request an action that requires admin approval"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {myRequests.data?.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/40"
                >
                  <div className="flex items-center gap-3">
                    {request.status === "PENDING" ? (
                      <div className="p-2 rounded-md bg-amber-500/10">
                        <Clock className="size-4 text-amber-500" />
                      </div>
                    ) : request.status === "APPROVED" ? (
                      <div className="p-2 rounded-md bg-green-500/10">
                        <Check className="size-4 text-green-500" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-md bg-red-500/10">
                        <X className="size-4 text-red-500" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {formatActionType(request.actionType)}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={request.status === "APPROVED" ? "default" : request.status === "REJECTED" ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {request.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Members section */}
        <Card className="border-border/40 shadow-sm bg-card/60 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both" style={{ animationDelay: '100ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/40">
            <div>
              <CardTitle className="text-lg flex items-center gap-2 font-semibold">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <Users className="size-4 text-primary" />
                </div>
                Members
              </CardTitle>
              <CardDescription className="mt-1.5">
                {team.data.members?.length} member
                {team.data.members?.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            {isOwnerOrAdmin && (
              <Button size="sm" onClick={() => setInviting(true)} className="shadow-sm hover:translate-y-[-1px] transition-transform">
                <UserPlus className="size-4 mr-2" />
                Invite
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-1 p-3">
            {team.data.members?.map((member) => {
              const RoleIcon =
                roleIcon[member.role as keyof typeof roleIcon] ?? User;
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/40 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9 ring-2 ring-background shadow-sm group-hover:ring-primary/20 transition-all">
                      <AvatarImage
                        src={member.user.image ?? undefined}
                        alt={member.user.name}
                      />
                      <AvatarFallback className="bg-primary/5 text-primary">
                        {member.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-semibold leading-none text-foreground">
                        {member.user.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {member.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        roleColor[member.role as keyof typeof roleColor],
                      )}
                    >
                      <RoleIcon className="size-3 mr-1" />
                      {member.role}
                    </Badge>
                    {isOwner && member.role !== "OWNER" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7">
                            <MoreVertical className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              updateRole.mutate({
                                teamId,
                                userId: member.user.id,
                                role:
                                  member.role === "ADMIN" ? "MEMBER" : "ADMIN",
                              })
                            }
                          >
                            <Shield className="size-4 mr-2" />
                            {member.role === "ADMIN"
                              ? "Demote to Member"
                              : "Promote to Admin"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() =>
                              removeMember.mutate({
                                teamId,
                                userId: member.user.id,
                              })
                            }
                          >
                            <Trash2 className="size-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Shared repositories section */}
        <Card className="border-border/40 shadow-sm bg-card/60 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both" style={{ animationDelay: '200ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/40">
            <div>
              <CardTitle className="text-lg flex items-center gap-2 font-semibold">
                <div className="p-1.5 rounded-md bg-emerald-500/10">
                  <FolderGit2 className="size-4 text-emerald-500" />
                </div>
                Shared Repositories
              </CardTitle>
              <CardDescription className="mt-1.5">
                Repositories visible to all team members
              </CardDescription>
            </div>
            {isOwnerOrAdmin && (
              <Button size="sm" onClick={() => setShareDialogOpen(true)} className="shadow-sm hover:translate-y-[-1px] transition-transform">
                <Share2 className="size-4 mr-2" />
                Share Repo
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-3">
            {team.data.repositories?.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
                   <FolderGit2 className="size-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-foreground">No repositories yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                  Share a repository to collaborate on code reviews with your team.
                </p>
              </div>
            )}
            <div className="space-y-1">
              {team.data.repositories?.map((repo) => (
                <div
                  key={repo.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/40 transition-colors group/repo"
                >
                  <Link
                    href={`/repo/${repo.id}`}
                    className="flex items-center gap-4 flex-1 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
                  >
                    <div className="p-2 rounded-md bg-background shadow-sm border border-border/50 group-hover/repo:border-emerald-500/30 transition-colors">
                      <FolderGit2 className="size-4 text-emerald-500/70 group-hover/repo:text-emerald-500 transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground group-hover/repo:text-primary transition-colors">{repo.fullName}</p>
                      <Badge variant="secondary" className="mt-1 text-[9px] px-1.5 py-0 bg-muted-foreground/10 text-muted-foreground font-medium rounded-sm">
                        {repo.private ? "Private" : "Public"}
                      </Badge>
                    </div>
                  </Link>
                  {isOwnerOrAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover/repo:opacity-100 transition-all focus:opacity-100"
                      onClick={() =>
                        unshareRepo.mutate({ repositoryId: repo.id })
                      }
                      title="Unshare repository"
                    >
                      <Unlink className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invite member dialog */}
      <AlertDialog open={inviting} onOpenChange={setInviting}>
        <AlertDialogContent className="sm:max-w-md border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Invite a member</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground/80">
              Enter the email of an existing user to invite them to this team.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inviteEmail.trim()) {
                inviteMember.mutate({
                  teamId,
                  email: inviteEmail.trim(),
                  role: inviteRole,
                });
              }
            }}
          >
            <div className="space-y-4 py-4 mb-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Email Address</label>
                <Input
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="bg-background/50 border-border/50 focus-visible:ring-primary/30"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Role</label>
                <Select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "MEMBER" | "ADMIN")}
                  className="bg-background/50 border-border/50 focus:ring-primary/30"
                >
                  <option value="MEMBER">Member — can view & comment</option>
                  <option value="ADMIN">Admin — can manage repos & members</option>
                </Select>
              </div>
            </div>
            <AlertDialogFooter className="sm:justify-between border-t border-border/40 pt-4">
              <AlertDialogAction
                type="button"
                onClick={() => setInviting(false)}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 flex-1 sm:flex-none"
              >
                Cancel
              </AlertDialogAction>
              <Button
                type="submit"
                disabled={!inviteEmail.trim() || inviteMember.isPending}
                className="flex-1 sm:flex-none relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                <span className="relative inline-flex items-center">
                  {inviteMember.isPending ? "Inviting..." : "Send Invite"}
                </span>
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share repo dialog */}
      <AlertDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <AlertDialogContent className="sm:max-w-md border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Share a repository</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground/80">
              Select one of your connected repositories to share with this team.
              All team members will be able to view PRs and reviews.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-64 overflow-y-auto space-y-2 py-4 mb-2 pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            {sharableRepos.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6">
                 <FolderGit2 className="size-8 text-muted-foreground/30 mb-2" />
                 <p className="text-sm font-medium text-foreground">No repositories available</p>
                 <p className="text-xs text-muted-foreground text-center mt-1">You either don&apos;t own any repositories or they are all already shared.</p>
              </div>
            )}
            {sharableRepos.map((repo) => (
              <button
                key={repo.id}
                className="group/sharebtn w-full flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/50 hover:bg-muted/60 hover:border-primary/30 transition-all text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() =>
                  shareRepo.mutate({ teamId, repositoryId: repo.id })
                }
                disabled={shareRepo.isPending}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-background shadow-sm border border-border/50 group-hover/sharebtn:border-primary/20 transition-colors">
                    <FolderGit2 className="size-4 text-muted-foreground group-hover/sharebtn:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground group-hover/sharebtn:text-primary transition-colors">{repo.fullName}</p>
                    <Badge variant="secondary" className="mt-1 text-[9px] px-1.5 py-0 bg-muted-foreground/10 text-muted-foreground font-medium rounded-sm">
                      {repo.private ? "Private" : "Public"}
                    </Badge>
                  </div>
                </div>
                <div className="size-8 rounded-full flex items-center justify-center bg-primary/5 text-primary opacity-0 group-hover/sharebtn:opacity-100 transition-all -translate-x-2 group-hover/sharebtn:translate-x-0">
                  <Share2 className="size-4" />
                </div>
              </button>
            ))}
          </div>
          <AlertDialogFooter className="border-t border-border/40 pt-4">
            <AlertDialogAction className="w-full sm:w-auto">Done</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Request Action dialog - for members to request admin actions */}
      <AlertDialog open={requestActionDialogOpen} onOpenChange={setRequestActionDialogOpen}>
        <AlertDialogContent className="sm:max-w-md border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Request an Action</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground/80">
              Request an action that requires approval from a team administrator.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4 mb-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Action Type</label>
              <Select
                value={selectedActionType}
                onChange={(e) => setSelectedActionType(e.target.value)}
                className="bg-background/50 border-border/50 focus:ring-primary/30"
              >
                <option value="">Select an action...</option>
                <option value="INVITE_MEMBER">Invite Member</option>
                <option value="REMOVE_MEMBER">Remove Member</option>
                <option value="UPDATE_ROLE">Update Member Role</option>
                <option value="SHARE_REPOSITORY">Share Repository</option>
                <option value="UNSHARE_REPOSITORY">Unshare Repository</option>
                <option value="REVIEW_PR">Review PR</option>
                <option value="APPROVE_DISCUSSION">Approve Discussion</option>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Your request will be sent to the team administrators for review.
              You&apos;ll be notified when your request is approved or rejected.
            </p>
          </div>
          <AlertDialogFooter className="border-t border-border/40 pt-4">
            <AlertDialogAction
              type="button"
              onClick={() => setRequestActionDialogOpen(false)}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              Cancel
            </AlertDialogAction>
            <Button
              type="submit"
              disabled={!selectedActionType || requestAction.isPending}
              onClick={() => {
                if (selectedActionType) {
                  requestAction.mutate({
                    teamId,
                    actionType: selectedActionType as "INVITE_MEMBER" | "REMOVE_MEMBER" | "UPDATE_ROLE" | "SHARE_REPOSITORY" | "UNSHARE_REPOSITORY" | "DELETE_TEAM" | "REVIEW_PR" | "APPROVE_DISCUSSION",
                  });
                  setRequestActionDialogOpen(false);
                  setSelectedActionType("");
                }
              }}
              className="relative overflow-hidden group"
            >
              <span className="relative inline-flex items-center">
                {requestAction.isPending ? "Submitting..." : "Submit Request"}
              </span>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </div>
  );
}
