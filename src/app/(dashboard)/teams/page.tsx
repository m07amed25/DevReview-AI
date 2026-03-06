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
    <div className="relative min-h-[calc(100vh-8rem)]">
      {/* Abstract Background Pattern */}
      <div className="pointer-events-none absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-50"></div>

      <div className="space-y-8 max-w-6xl mx-auto pb-12 pt-4 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent drop-shadow-sm">Teams</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base max-w-xl">
            Create teams to share repositories and collaborate on reviews together in real-time.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 animate-in fade-in slide-in-from-right-8 duration-700">
          <Plus className="size-4 mr-2" />
          Create Team
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
        <AlertDialogContent className="sm:max-w-md border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Create a new team</AlertDialogTitle>
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

      {/* Loading */}
      {teams.isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden border-border/40 shadow-sm bg-card/40 backdrop-blur-sm animate-pulse">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="size-12 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full rounded-lg mb-4" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="size-8 rounded-full" />
                </div>
              </CardContent>
            </Card>
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
            
            <h3 className="font-bold text-2xl mb-3 text-foreground tracking-tight">No teams found</h3>
            <p className="text-muted-foreground/80 max-w-md mx-auto mb-8 leading-relaxed">
              Gather your collaborators, share repositories, and supercharge your code reviews by creating a team workspace.
            </p>
            <Button onClick={() => setCreating(true)} size="lg" className="shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative z-10 group">
              <Plus className="size-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
              Create your first team
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Team cards */}
      {teams.data && teams.data.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams.data.map((team) => {
            const RoleIcon = roleIcon[team.role as keyof typeof roleIcon];
            
            // Generate a consistent gradient based on the team name length
            const gradients = [
              "from-indigo-500 to-purple-500",
              "from-blue-500 to-cyan-500",
              "from-emerald-500 to-teal-500",
              "from-orange-500 to-red-500",
              "from-pink-500 to-rose-500",
              "from-violet-500 to-fuchsia-500",
            ];
            const gradient = gradients[team.name.length % gradients.length];

            return (
              <Link 
                key={team.id} 
                href={`/teams/${team.id}`} 
                className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
                style={{ animationDelay: `${(teams.data.indexOf(team) * 100) + 150}ms` }}
              >
                <Card className="group relative overflow-hidden h-full border-border/40 hover:border-primary/40 transition-all duration-500 hover:shadow-xl hover:-translate-y-1.5 bg-card/60 backdrop-blur-xl">
                  {/* Subtle top gradient line */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  {/* Glowing background effect on hover */}
                  <div className={`absolute -inset-24 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.03] blur-2xl transition-opacity duration-700`} />
                  
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4 pt-6 relative z-10">
                    <div className="flex items-start gap-4">
                      <div className={`size-12 rounded-xl bg-gradient-to-br ${gradient} p-[1px] shadow-sm`}>
                        <div className="w-full h-full rounded-xl bg-background/90 group-hover:bg-background/80 transition-colors flex items-center justify-center text-foreground font-bold text-xl">
                          {team.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="pt-1">
                        <CardTitle className="text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                          {team.name}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          /{team.slug}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pb-6">
                    <div className="flex items-center gap-5 text-sm text-muted-foreground/80 font-medium bg-muted/40 p-3 rounded-lg border border-border/40">
                      <div className="flex items-center gap-2">
                        <Users className="size-4 text-primary/70" />
                        <span className="text-foreground">{team.memberCount}</span> <span className="hidden sm:inline">Members</span>
                      </div>
                      <div className="w-px h-4 bg-border" />
                      <div className="flex items-center gap-2">
                        <FolderGit2 className="size-4 text-emerald-500/70" />
                        <span className="text-foreground">{team.repoCount}</span> <span className="hidden sm:inline">Repos</span>
                      </div>
                    </div>
                    
                    <div className="mt-5 flex items-center justify-between">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[11px] px-2.5 py-0.5 rounded-full font-medium shadow-sm transition-colors border",
                          team.role === "OWNER" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border-amber-500/20" : 
                          team.role === "ADMIN" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border-blue-500/20" : 
                          "bg-slate-500/10 text-slate-600 dark:text-slate-400 hover:bg-slate-500/20 border-slate-500/20"
                        )}
                      >
                        <RoleIcon className="size-3 mr-1.5 inline-block" />
                        {team.role}
                      </Badge>
                      
                      <div className="size-8 rounded-full bg-primary/5 text-primary flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                        <ArrowRight className="size-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
    </div>
  );
}
