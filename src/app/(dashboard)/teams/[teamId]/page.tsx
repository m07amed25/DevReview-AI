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
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const roleIcon = { OWNER: Crown, ADMIN: Shield, MEMBER: User } as const;
const roleColor = {
  OWNER: "text-amber-500",
  ADMIN: "text-blue-500",
  MEMBER: "text-muted-foreground",
} as const;

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
  const utils = trpc.useUtils();

  const inviteMember = trpc.team.inviteMember.useMutation({
    onSuccess: () => {
      setInviteEmail("");
      setInviting(false);
      utils.team.get.invalidate({ teamId });
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
    <div className="space-y-8">
      {/* Error dialog */}
      <AlertDialog open={!!error} onOpenChange={() => setError(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error</AlertDialogTitle>
            <AlertDialogDescription>{error}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/teams">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
              {team.data.name!.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {team.data.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                /{team.data.slug}
              </p>
            </div>
          </div>
        </div>
        {isOwner && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setConfirmDelete(true)}
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Members section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="size-4" />
                Members
              </CardTitle>
              <CardDescription>
                {team.data.members?.length} member
                {team.data.members?.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            {isOwnerOrAdmin && (
              <Button size="sm" onClick={() => setInviting(true)}>
                <UserPlus className="size-4 mr-2" />
                Invite
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {team.data.members?.map((member) => {
              const RoleIcon =
                roleIcon[member.role as keyof typeof roleIcon] ?? User;
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarImage
                        src={member.user.image ?? undefined}
                        alt={member.user.name}
                      />
                      <AvatarFallback>
                        {member.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-tight">
                        {member.user.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FolderGit2 className="size-4" />
                Shared Repositories
              </CardTitle>
              <CardDescription>
                Repositories visible to all team members
              </CardDescription>
            </div>
            {isOwnerOrAdmin && (
              <Button size="sm" onClick={() => setShareDialogOpen(true)}>
                <Share2 className="size-4 mr-2" />
                Share Repo
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {team.data.repositories?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No repositories shared yet
              </p>
            )}
            <div className="space-y-3">
              {team.data.repositories?.map((repo) => (
                <div
                  key={repo.id}
                  className="flex items-center justify-between py-2"
                >
                  <Link
                    href={`/repo/${repo.id}`}
                    className="flex items-center gap-3 hover:underline"
                  >
                    <FolderGit2 className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{repo.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {repo.private ? "Private" : "Public"}
                      </p>
                    </div>
                  </Link>
                  {isOwnerOrAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        unshareRepo.mutate({ repositoryId: repo.id })
                      }
                    >
                      <Unlink className="size-3.5" />
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Invite a member</AlertDialogTitle>
            <AlertDialogDescription>
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
            <div className="space-y-3 mb-4">
              <Input
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                autoFocus
              />
              <Select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "MEMBER" | "ADMIN")}
              >
                <option value="MEMBER">Member — can view &amp; comment</option>
                <option value="ADMIN">Admin — can manage repos &amp; members</option>
              </Select>
            </div>
            <AlertDialogFooter>
              <AlertDialogAction
                type="button"
                onClick={() => setInviting(false)}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                Cancel
              </AlertDialogAction>
              <Button
                type="submit"
                disabled={!inviteEmail.trim() || inviteMember.isPending}
              >
                {inviteMember.isPending ? "Inviting..." : "Send Invite"}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share repo dialog */}
      <AlertDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Share a repository</AlertDialogTitle>
            <AlertDialogDescription>
              Select one of your connected repositories to share with this team.
              All team members will be able to view PRs and reviews.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
            {sharableRepos.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No available repositories to share
              </p>
            )}
            {sharableRepos.map((repo) => (
              <button
                key={repo.id}
                className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                onClick={() =>
                  shareRepo.mutate({ teamId, repositoryId: repo.id })
                }
                disabled={shareRepo.isPending}
              >
                <div className="flex items-center gap-3">
                  <FolderGit2 className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{repo.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {repo.private ? "Private" : "Public"}
                    </p>
                  </div>
                </div>
                <Share2 className="size-4 text-muted-foreground" />
              </button>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
