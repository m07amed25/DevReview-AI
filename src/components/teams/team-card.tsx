"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Users,
  FolderGit2,
  ArrowRight,
  Crown,
  Shield,
  User,
  Calendar,
  MoreHorizontal,
  Settings,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const roleIcon = {
  OWNER: Crown,
  ADMIN: Shield,
  MEMBER: User,
} as const;

export type TeamRole = "OWNER" | "ADMIN" | "MEMBER";

export interface TeamMemberPreview {
  id: string;
  name: string;
  image: string | null;
}

export interface TeamCardProps {
  id: string;
  name: string;
  slug: string;
  role: TeamRole;
  memberCount: number;
  repoCount: number;
  description?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  members?: TeamMemberPreview[];
  index?: number;
  onSettingsClick?: (teamId: string) => void;
}

const gradients = [
  "from-indigo-500 to-purple-500",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-red-500",
  "from-pink-500 to-rose-500",
  "from-violet-500 to-fuchsia-500",
];

// Format relative time
function formatRelativeTime(date: string | Date | undefined): string {
  if (!date) return "Recently";

  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffMonths / 12);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffMonths < 12) return `${diffMonths} months ago`;
  return `${diffYears} years ago`;
}

export function TeamCard({
  id,
  name,
  slug,
  role,
  memberCount,
  repoCount,
  description,
  createdAt,
  updatedAt,
  members = [],
  index = 0,
  onSettingsClick,
}: TeamCardProps) {
  const RoleIcon = roleIcon[role];
  const gradient = gradients[name.length % gradients.length];

  return (
    <Link
      key={id}
      href={`/teams/${id}`}
      className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
      style={{ animationDelay: `${index * 100 + 150}ms` }}
    >
      <Card className="group relative overflow-hidden h-full border-border/40 hover:border-primary/40 transition-all duration-500 hover:shadow-xl hover:-translate-y-1.5 bg-card/60 backdrop-blur-xl">
        {/* Subtle top gradient line */}
        <div
          className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} opacity-50 group-hover:opacity-100 transition-opacity duration-500`}
        />

        {/* Glowing background effect on hover */}
        <div
          className={`absolute -inset-24 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.03] blur-2xl transition-opacity duration-700`}
        />

        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 pt-6 relative z-10">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div
              className={`size-14 rounded-xl bg-gradient-to-br ${gradient} p-[1px] shadow-sm shrink-0`}
            >
              <div className="w-full h-full rounded-xl bg-background/90 group-hover:bg-background/80 transition-colors flex items-center justify-center text-foreground font-bold text-2xl">
                {name.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="pt-1 min-w-0 flex-1">
              <CardTitle className="text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors flex items-center gap-2">
                {name}
                {role === "OWNER" && (
                  <Crown className="size-4 text-amber-500 shrink-0" />
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1 font-mono">
                /{slug}
              </p>
              {description && (
                <p className="text-xs text-muted-foreground/80 mt-2 line-clamp-2 hidden group-hover:block transition-all">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Quick action button */}
          <Button
            variant="ghost"
            size="icon-xs"
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-muted/80"
            onClick={(e) => {
              e.preventDefault();
              onSettingsClick?.(id);
            }}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </CardHeader>

        <CardContent className="pb-4 space-y-4">
          {/* Stats row */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground/80 font-medium bg-muted/40 p-3 rounded-lg border border-border/40">
            <div className="flex items-center gap-2 flex-1">
              <Users className="size-4 text-primary/70" />
              <span className="text-foreground font-semibold">
                {memberCount}
              </span>
              <span className="text-muted-foreground">Members</span>
            </div>
            <div className="w-px h-5 bg-border" />
            <div className="flex items-center gap-2 flex-1">
              <FolderGit2 className="size-4 text-emerald-500/70" />
              <span className="text-foreground font-semibold">{repoCount}</span>
              <span className="text-muted-foreground">Repos</span>
            </div>
          </div>

          {/* Member avatars preview */}
          {members.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center -space-x-2">
                {members.slice(0, 5).map((member) => (
                  <Avatar
                    key={member.id}
                    size="sm"
                    className="ring-2 ring-card border-2 border-background"
                  >
                    <AvatarImage
                      src={member.image ?? undefined}
                      alt={member.name}
                    />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {member.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {memberCount > 5 && (
                  <div className="size-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium text-muted-foreground">
                    +{memberCount - 5}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer with role and time */}
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <Badge
              variant="secondary"
              className={cn(
                "text-[11px] px-2.5 py-0.5 rounded-full font-medium shadow-sm transition-colors border",
                role === "OWNER"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border-amber-500/20"
                  : role === "ADMIN"
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border-blue-500/20"
                    : "bg-slate-500/10 text-slate-600 dark:text-slate-400 hover:bg-slate-500/20 border-slate-500/20",
              )}
            >
              <RoleIcon className="size-3 mr-1.5 inline-block" />
              {role === "OWNER"
                ? "Owner"
                : role === "ADMIN"
                  ? "Admin"
                  : "Member"}
            </Badge>

            <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
              <Calendar className="size-3" />
              <span>
                {createdAt ? formatRelativeTime(createdAt) : "Active"}
              </span>
            </div>
          </div>

          {/* Arrow indicator */}
          <div className="absolute bottom-4 right-4">
            <div className="size-8 rounded-full bg-primary/5 text-primary flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
              <ArrowRight className="size-4" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function TeamCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/40 shadow-sm bg-card/40 backdrop-blur-sm animate-pulse h-full">
      <CardHeader className="pb-3 pt-6">
        <div className="flex items-start gap-4">
          <div className="size-14 rounded-xl bg-muted" />
          <div className="space-y-2 pt-1 flex-1">
            <div className="h-5 w-32 bg-muted rounded" />
            <div className="h-3 w-20 bg-muted rounded" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4 space-y-4">
        <div className="h-14 w-full rounded-lg bg-muted" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted" />
          <div className="h-8 w-8 rounded-full bg-muted" />
          <div className="h-8 w-8 rounded-full bg-muted" />
        </div>
        <div className="flex justify-between items-center pt-2">
          <div className="h-6 w-16 bg-muted rounded-full" />
          <div className="h-4 w-16 bg-muted rounded" />
        </div>
      </CardContent>
    </Card>
  );
}
