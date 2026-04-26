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
      <div className="grid gap-4 md:grid-cols-3 mb-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-card">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-16 mb-2" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Connected */}
      <Card className="bg-card transition-shadow hover:shadow-sm pb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <FolderGit2 className="size-4" />
            Connected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight">
            {connectedCount}
          </div>
          <p className="text-xs text-muted-foreground my-2 flex items-center gap-1.5">
            <CheckCircle className="size-3 text-emerald-500" />
            Repositories linked
          </p>
          {connectedCount > 0 && (
            <div className="mt-2 pt-2 border-t border-border/50">
              <span className="text-xs text-muted-foreground">
                {connectedPrivate} private, {connectedPublic} public
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available */}
      <Card className="bg-card transition-shadow hover:shadow-sm pb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <GitPullRequest className="size-4" />
            Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight">
            {availableCount}
          </div>
          <p className="text-xs text-muted-foreground my-2 flex items-center gap-1.5">
            <Globe className="size-3 text-blue-500" />
            GitHub repositories
          </p>
          {totalGithubCount > 0 && (
            <div className="mt-2 pt-2 border-t border-border/50">
              <span className="text-xs text-muted-foreground">
                {Math.round((availableCount / totalGithubCount) * 100)}% not
                connected
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selection */}
      <Card className="bg-card transition-shadow hover:shadow-sm pb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Star className="size-4" />
            Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight">
            {selectedCount}
          </div>
          <p className="text-xs text-muted-foreground my-2 flex items-center gap-1.5">
            <Check className="size-3 text-primary" />
            Selected to connect
          </p>
          {availableCount > 0 && (
            <div className="mt-2 pt-2 border-t border-border/50">
              <div className="w-full bg-secondary rounded-full h-1.5 mb-1">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.round((selectedCount / availableCount) * 100)}%`,
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
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
