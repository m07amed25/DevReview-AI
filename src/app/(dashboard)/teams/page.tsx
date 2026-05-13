"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Users, Plus, FolderGit2, Search } from "lucide-react";
import {
  TeamCard,
  TeamCardSkeleton,
} from "@/features/teams/components/team-card";
import { useTeamList } from "@/features/teams/hooks/use-team";
import type { TeamData } from "@/features/teams/types";
import { toast } from "sonner";

export default function TeamsPage() {
  const [creating, setCreating] = useState(false);
  const [teamName, setTeamName] = useState("");

  const {
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    filterTeams,
  } = useTeamList();

  const teams = trpc.team.list.useQuery();
  const utils = trpc.useUtils();

  const createTeam = trpc.team.create.useMutation({
    onSuccess: () => {
      setCreating(false);
      setTeamName("");
      toast.success("Team created successfully");
      utils.team.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create team");
    },
  });

  const filteredTeams = filterTeams(teams.data as TeamData[] | undefined);

  const handleCreateTeam = (name: string) => {
    createTeam.mutate({ name });
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)]">
      <div className="flex-1 space-y-6 max-w-6xl mx-auto w-full pb-12 pt-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Teams</h1>
            <p className="text-muted-foreground mt-1.5 text-sm max-w-xl">
              Create teams to share repositories and collaborate on reviews.
            </p>
          </div>
          <Button onClick={() => setCreating(true)} size="sm" className="shadow-none">
            <Plus className="size-4 mr-2" />
            Create Team
          </Button>
        </div>

        {teams.data && teams.data.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background h-9"
              />
            </div>
            <div className="flex gap-1.5">
              {(["ALL", "OWNER", "ADMIN", "MEMBER"] as const).map((role) => (
                <Button
                  key={role}
                  variant={roleFilter === role ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setRoleFilter(role)}
                  className="h-9 text-sm font-normal"
                >
                  {role === "ALL" ? "All Roles" : role}
                </Button>
              ))}
            </div>
          </div>
        )}



        <AlertDialog open={creating} onOpenChange={setCreating}>
          <AlertDialogContent className="sm:max-w-md">
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
              <div className="py-4">
                <Input
                  placeholder="E.g. Frontend Engineering"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="bg-background"
                  autoFocus
                  maxLength={40}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogAction
                  type="button"
                  variant="outline"
                  onClick={() => setCreating(false)}
                >
                  Cancel
                </AlertDialogAction>
                <Button
                  type="submit"
                  disabled={teamName.trim().length < 2 || createTeam.isPending}
                >
                  {createTeam.isPending ? "Creating..." : "Create Team"}
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>

        {teams.isLoading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <TeamCardSkeleton key={i} />
            ))}
          </div>
        )}

        {teams.data && teams.data.length === 0 && (
          <div className="border border-border border-dashed rounded-lg flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <Users className="size-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold mb-1">No teams</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-[300px]">
              Create a team to group members and share repositories.
            </p>
            <Button onClick={() => setCreating(true)} size="sm">
              <Plus className="size-4 mr-2" />
              Create Team
            </Button>
          </div>
        )}

        {teams.data && teams.data.length > 0 && filteredTeams.length === 0 && (
          <div className="border border-border border-dashed rounded-lg text-center py-12">
            <p className="text-sm font-medium">No teams match your search</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your filters.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setRoleFilter("ALL");
              }}
              className="mt-4"
            >
              Clear filters
            </Button>
          </div>
        )}

        {teams.data && filteredTeams.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTeams.map((team, index) => (
              <TeamCard
                key={team.id}
                id={team.id}
                name={team.name}
                slug={team.slug}
                role={team.role}
                memberCount={team.memberCount}
                repoCount={team.repoCount}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
