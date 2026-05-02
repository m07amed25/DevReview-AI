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
      <Card className="bg-card shadow-sm border-border">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Connected
          </CardTitle>
          <FolderGit2 className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{connectedCount}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Repositories linked to your account
          </p>
          {connectedCount > 0 && (
            <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                {connectedPrivate} private
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                {connectedPublic} public
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available */}
      <Card className="bg-card shadow-sm border-border">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Available
          </CardTitle>
          <Globe className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{availableCount}</div>
          <p className="text-xs text-muted-foreground mt-1">
            GitHub repositories not yet connected
          </p>
          {totalGithubCount > 0 && (
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>Not connected</span>
              <span className="font-medium">
                {Math.round((availableCount / totalGithubCount) * 100)}%
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selection */}
      <Card className="bg-card shadow-sm border-border">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Selection
          </CardTitle>
          <Star className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{selectedCount}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Selected for connection
          </p>
          {availableCount > 0 && (
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Capacity</span>
                <span className="font-medium text-foreground">
                  {Math.round((selectedCount / availableCount) * 100)}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                <div
                  className="bg-foreground h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.round((selectedCount / availableCount) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
