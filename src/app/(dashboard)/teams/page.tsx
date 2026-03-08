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
import { TeamCard, TeamCardSkeleton } from "@/components/teams/team-card";
import { useTeamList } from "@/hooks/use-team";
import type { TeamData } from "@/types/team";

export default function TeamsPage() {
  const [creating, setCreating] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState<string | null>(null);

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
      utils.team.list.invalidate();
    },
    onError: (err) => setError(err.message),
  });

  const filteredTeams = filterTeams(teams.data as TeamData[] | undefined);

  const handleCreateTeam = (name: string) => {
    createTeam.mutate({ name });
  };

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      <div className="pointer-events-none absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-50"></div>

      <div className="space-y-8 max-w-6xl mx-auto pb-12 pt-4 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent drop-shadow-sm">
              Teams
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base max-w-xl">
              Create teams to share repositories and collaborate on reviews
              together in real-time.
            </p>
          </div>
          <Button
            onClick={() => setCreating(true)}
            className="shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 animate-in fade-in slide-in-from-right-8 duration-700"
          >
            <Plus className="size-4 mr-2" />
            Create Team
          </Button>
        </div>

        {teams.data && teams.data.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background/50 border-border/50 focus-visible:ring-primary/30"
              />
            </div>
            <div className="flex gap-2">
              {(["ALL", "OWNER", "ADMIN", "MEMBER"] as const).map((role) => (
                <Button
                  key={role}
                  variant={roleFilter === role ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRoleFilter(role)}
                  className="text-xs"
                >
                  {role === "ALL" ? "All" : role}
                </Button>
              ))}
            </div>
          </div>
        )}

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

        <AlertDialog open={creating} onOpenChange={setCreating}>
          <AlertDialogContent className="sm:max-w-md border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl">
                Create a new team
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground/80">
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
                  className="h-11 bg-background/50 border-border/50 focus-visible:ring-primary/30 transition-shadow"
                  autoFocus
                  maxLength={40}
                />
              </div>
              <AlertDialogFooter className="sm:justify-between">
                <AlertDialogAction
                  type="button"
                  onClick={() => setCreating(false)}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/80 flex-1 sm:flex-none"
                >
                  Cancel
                </AlertDialogAction>
                <Button
                  type="submit"
                  disabled={teamName.trim().length < 2 || createTeam.isPending}
                  className="flex-1 sm:flex-none"
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

        {/* Empty state */}
        {teams.data && teams.data.length === 0 && (
          <Card className="border-dashed bg-muted/10 shadow-sm border-border/60 animate-in fade-in zoom-in-95 duration-700">
            <CardContent className="py-24 text-center flex flex-col items-center justify-center relative overflow-hidden">
              {/* Background glowing orb */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />

              <div className="relative size-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 shadow-inner border border-primary/10 rotate-3 transition-transform hover:rotate-6 duration-500">
                <Users className="size-12 text-primary drop-shadow-sm" />
                <div className="absolute -bottom-2 -left-3 size-10 rounded-full bg-background border shadow-sm flex items-center justify-center -rotate-6">
                  <FolderGit2 className="size-5 text-emerald-500" />
                </div>
                <div className="absolute -top-3 -right-2 size-8 rounded-full bg-background border shadow-sm flex items-center justify-center rotate-12">
                  <Plus className="size-4 text-blue-500" />
                </div>
              </div>

              <h3 className="font-bold text-2xl mb-3 text-foreground tracking-tight">
                No teams found
              </h3>
              <p className="text-muted-foreground/80 max-w-md mx-auto mb-8 leading-relaxed">
                Gather your collaborators, share repositories, and supercharge
                your code reviews by creating a team workspace.
              </p>
              <Button
                onClick={() => setCreating(true)}
                size="lg"
                className="shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative z-10 group"
              >
                <Plus className="size-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                Create your first team
              </Button>
            </CardContent>
          </Card>
        )}

        {/* No search results */}
        {teams.data && teams.data.length > 0 && filteredTeams.length === 0 && (
          <div className="text-center py-12 animate-in fade-in duration-500">
            <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Search className="size-8 text-muted-foreground/50" />
            </div>
            <h3 className="font-semibold text-lg text-foreground mb-2">
              No teams match your search
            </h3>
            <p className="text-muted-foreground text-sm">
              Try adjusting your search query or filter.
            </p>
            <Button
              variant="outline"
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

        {/* Team cards */}
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
