import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FolderGit2,
  GitPullRequest,
  Globe,
  CheckCircle,
  Star,
  Check,
} from "lucide-react";

interface StatsCardsProps {
  connectedCount: number;
  connectedPrivate: number;
  connectedPublic: number;
  availableCount: number;
  totalGithubCount: number;
  selectedCount: number;
  isLoading: boolean;
}

export function StatsCards({
  connectedCount,
  connectedPrivate,
  connectedPublic,
  availableCount,
  totalGithubCount,
  selectedCount,
  isLoading,
}: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20">
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-9 w-16 mb-2" />
            <Skeleton className="h-3 w-28" />
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-9 w-16 mb-2" />
            <Skeleton className="h-3 w-28" />
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-9 w-16 mb-2" />
            <Skeleton className="h-3 w-28" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Connected */}
      <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300 hover:-translate-y-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-violet-600 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-violet-500/20">
              <FolderGit2 className="size-4" />
            </div>
            Connected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-violet-600 tracking-tight">
            {connectedCount}
          </div>
          <p className="text-xs text-muted-foreground my-2 flex items-center gap-1.5">
            <CheckCircle className="size-3 text-violet-500" />
            Repositories linked
          </p>
          {connectedCount > 0 && (
            <div className="mt-2 pt-2 border-t border-violet-500/10">
              <span className="text-xs text-violet-600/70">
                {connectedPrivate} private, {connectedPublic} public
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available */}
      <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-emerald-600 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20">
              <GitPullRequest className="size-4" />
            </div>
            Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-emerald-600 tracking-tight">
            {availableCount}
          </div>
          <p className="text-xs text-muted-foreground my-2 flex items-center gap-1.5">
            <Globe className="size-3 text-emerald-500" />
            GitHub repositories
          </p>
          {totalGithubCount > 0 && (
            <div className="mt-2 pt-2 border-t border-emerald-500/10">
              <span className="text-xs text-emerald-600/70">
                {Math.round((availableCount / totalGithubCount) * 100)}% not
                connected
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selection */}
      <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/20">
              <Star className="size-4" />
            </div>
            Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-blue-600 tracking-tight">
            {selectedCount}
          </div>
          <p className="text-xs text-muted-foreground my-2 flex items-center gap-1.5">
            <Check className="size-3 text-blue-500" />
            Selected to connect
          </p>
          {availableCount > 0 && (
            <div className="mt-2 pt-2 border-t border-blue-500/10">
              <div className="w-full bg-blue-500/20 rounded-full h-1.5 mb-1">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.round((selectedCount / availableCount) * 100)}%`,
                  }}
                />
              </div>
              <span className="text-xs text-blue-600/70">
                {Math.round((selectedCount / availableCount) * 100)}% of
                available
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
