"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
  Users,
  Plus,
  FolderGit2,
  ArrowRight,
  Crown,
  Shield,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const roleIcon = {
  OWNER: Crown,
  ADMIN: Shield,
  MEMBER: User,
} as const;

const roleColor = {
  OWNER: "text-amber-500",
  ADMIN: "text-blue-500",
  MEMBER: "text-muted-foreground",
} as const;

export default function TeamsPage() {
  const [creating, setCreating] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const teams = trpc.team.list.useQuery();
  const utils = trpc.useUtils();

  const createTeam = trpc.team.create.useMutation({
    onSuccess: () => {
      setCreating(false);
      setTeamName("");
      utils.team.list.invalidate();
    },
    onError: (err) => setError(err.message),
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create teams to share repositories and reviews with collaborators
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4 mr-2" />
          New Team
        </Button>
      </div>

      {/* Error dialog */}
      <AlertDialog open={!!error} onOpenChange={() => setError(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error</AlertDialogTitle>
            <AlertDialogDescription>{error}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setError(null)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create team dialog */}
      <AlertDialog open={creating} onOpenChange={setCreating}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create a new team</AlertDialogTitle>
            <AlertDialogDescription>
              Give your team a name. You can invite members after creation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (teamName.trim().length >= 2) {
                createTeam.mutate({ name: teamName.trim() });
              }
            }}
          >
            <Input
              placeholder="Team name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="mb-4"
              autoFocus
            />
            <AlertDialogFooter>
              <AlertDialogAction
                type="button"
                onClick={() => setCreating(false)}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                Cancel
              </AlertDialogAction>
              <Button
                type="submit"
                disabled={
                  teamName.trim().length < 2 || createTeam.isPending
                }
              >
                {createTeam.isPending ? "Creating..." : "Create Team"}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Loading */}
      {teams.isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-24 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {teams.data && teams.data.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Users className="size-10 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-1">No teams yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              Create a team to share your repositories and AI reviews with
              collaborators in real-time.
            </p>
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4 mr-2" />
              Create your first team
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Team cards */}
      {teams.data && teams.data.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.data.map((team) => {
            const RoleIcon = roleIcon[team.role as keyof typeof roleIcon];
            return (
              <Link key={team.id} href={`/teams/${team.id}`}>
                <Card className="group hover:border-foreground/20 transition-colors cursor-pointer h-full">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                        {team.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-base leading-tight">
                          {team.name}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          /{team.slug}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Users className="size-3.5" />
                        {team.memberCount} member
                        {team.memberCount !== 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FolderGit2 className="size-3.5" />
                        {team.repoCount} repo
                        {team.repoCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "mt-3 text-xs",
                        roleColor[team.role as keyof typeof roleColor],
                      )}
                    >
                      <RoleIcon className="size-3 mr-1" />
                      {team.role}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
