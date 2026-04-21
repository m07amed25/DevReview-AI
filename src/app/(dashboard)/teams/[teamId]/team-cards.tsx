"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Check,
  ClipboardList,
  Clock,
  Crown,
  FolderGit2,
  MoreVertical,
  Share2,
  Shield,
  Trash2,
  Unlink,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function formatActionType(type: string): string {
  return type
    .replace("_", " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

const roleIcon = { OWNER: Crown, ADMIN: Shield, MEMBER: User } as const;
const roleColor = {
  OWNER: "text-amber-500",
  ADMIN: "text-blue-500",
  MEMBER: "text-muted-foreground",
} as const;

interface PendingAction {
  id: string;
  actionType: string;
  metadata?: unknown;
  createdAt: Date | string;
}

interface PendingApprovalsCardProps {
  teamId: string;
  pendingActions: { data?: PendingAction[]; isLoading: boolean };
  approveAction: {
    mutate: (args: { actionId: string }) => void;
    isPending: boolean;
  };
  rejectAction: {
    mutate: (args: { actionId: string }) => void;
    isPending: boolean;
  };
}

export function PendingApprovalsCard({
  teamId: _teamId, // eslint-disable-line @typescript-eslint/no-unused-vars
  pendingActions,
  approveAction,
  rejectAction,
}: PendingApprovalsCardProps) {
  return (
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
            {pendingActions.data?.length ?? 0} action
            {(pendingActions.data?.length ?? 0) !== 1 ? "s" : ""} awaiting
            approval
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        {pendingActions.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : !pendingActions.data?.length ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="size-10 rounded-full bg-muted flex items-center justify-center mb-3">
              <ClipboardList className="size-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium">No pending approvals</p>
            <p className="text-xs text-muted-foreground mt-1">
              All action requests have been processed
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingActions.data.map((action) => (
              <div
                key={action.id}
                className="flex items-center justify-between p-3 rounded-lg bg-amber-500/5 border border-amber-500/20"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-amber-500/10">
                    <Clock className="size-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {formatActionType(action.actionType)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Requested by user •{" "}
                      {new Date(action.createdAt).toLocaleDateString()}
                    </p>
                    {action.metadata !== undefined &&
                      action.metadata !== null && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {JSON.stringify(
                            action.metadata as Record<string, unknown>,
                          )}
                        </p>
                      )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-green-600 hover:text-green-700 hover:bg-green-600/10"
                    onClick={() =>
                      approveAction.mutate({ actionId: action.id })
                    }
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
  );
}

interface MyRequest {
  id: string;
  actionType: string;
  status: string;
  createdAt: Date | string;
}

interface MyRequestsCardProps {
  myRequests: { data?: MyRequest[]; isLoading: boolean };
  isOwnerOrAdmin: boolean;
  onRequestAction: () => void;
}

export function MyRequestsCard({
  myRequests,
  isOwnerOrAdmin,
  onRequestAction,
}: MyRequestsCardProps) {
  return (
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
            {myRequests.data?.length ?? 0} of your request
            {(myRequests.data?.length ?? 0) !== 1 ? "s" : ""}
          </CardDescription>
        </div>
        {!isOwnerOrAdmin && (
          <Button
            size="sm"
            onClick={onRequestAction}
            className="shadow-sm hover:-translate-y-px transition-transform"
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
        ) : !myRequests.data?.length ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="size-10 rounded-full bg-muted flex items-center justify-center mb-3">
              <ClipboardList className="size-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium">No pending requests</p>
            <p className="text-xs text-muted-foreground mt-1">
              {isOwnerOrAdmin
                ? "You don't have any pending action requests"
                : "Request an action that requires admin approval"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {myRequests.data.map((request) => (
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
                    <p className="text-sm font-semibold">
                      {formatActionType(request.actionType)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    request.status === "APPROVED"
                      ? "default"
                      : request.status === "REJECTED"
                        ? "destructive"
                        : "secondary"
                  }
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
  );
}

interface TeamMember {
  id: string;
  role: string;
  user: { id: string; name: string; email: string; image?: string | null };
}

interface MembersCardProps {
  members: TeamMember[];
  isOwnerOrAdmin: boolean;
  isOwner: boolean;
  onInvite: () => void;
  updateRole: {
    mutate: (args: { teamId: string; userId: string; role: "ADMIN" | "MEMBER" }) => void;
    isPending: boolean;
  };
  removeMember: {
    mutate: (args: { teamId: string; userId: string }) => void;
    isPending: boolean;
  };
  teamId: string;
}

export function MembersCard({
  members,
  isOwnerOrAdmin,
  isOwner,
  onInvite,
  updateRole,
  removeMember,
  teamId,
}: MembersCardProps) {
  return (
    <Card
      className="border-border/40 shadow-sm bg-card/60 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
      style={{ animationDelay: "100ms" }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/40">
        <div>
          <CardTitle className="text-lg flex items-center gap-2 font-semibold">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Users className="size-4 text-primary" />
            </div>
            Members
          </CardTitle>
          <CardDescription className="mt-1.5">
            {members.length} member{members.length !== 1 ? "s" : ""}
          </CardDescription>
        </div>
        {isOwnerOrAdmin && (
          <Button
            size="sm"
            onClick={onInvite}
            className="shadow-sm hover:-translate-y-px transition-transform"
          >
            <UserPlus className="size-4 mr-2" />
            Invite
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-1 p-3">
        {members.map((member) => {
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
                            role: member.role === "ADMIN" ? "MEMBER" : "ADMIN",
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
  );
}

interface SharedRepo {
  id: string;
  fullName: string;
  private: boolean;
}

interface ReposCardProps {
  repos: SharedRepo[];
  isOwnerOrAdmin: boolean;
  onShare: () => void;
  unshareRepo: {
    mutate: (args: { repositoryId: string }) => void;
    isPending: boolean;
  };
}

export function SharedReposCard({
  repos,
  isOwnerOrAdmin,
  onShare,
  unshareRepo,
}: ReposCardProps) {
  return (
    <Card
      className="border-border/40 shadow-sm bg-card/60 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
      style={{ animationDelay: "200ms" }}
    >
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
          <Button
            size="sm"
            onClick={onShare}
            className="shadow-sm hover:-translate-y-px transition-transform"
          >
            <Share2 className="size-4 mr-2" />
            Share Repo
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-3">
        {repos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <FolderGit2 className="size-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium">No repositories yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-50">
              Share a repository to collaborate on code reviews.
            </p>
          </div>
        )}
        <div className="space-y-1">
          {repos.map((repo) => (
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
                  <p className="text-sm font-semibold text-foreground group-hover/repo:text-primary transition-colors">
                    {repo.fullName}
                  </p>
                  <Badge
                    variant="secondary"
                    className="mt-1 text-[9px] px-1.5 py-0 bg-muted-foreground/10 text-muted-foreground font-medium rounded-sm"
                  >
                    {repo.private ? "Private" : "Public"}
                  </Badge>
                </div>
              </Link>
              {isOwnerOrAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover/repo:opacity-100 transition-all focus:opacity-100"
                  onClick={() => unshareRepo.mutate({ repositoryId: repo.id })}
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
  );
}
