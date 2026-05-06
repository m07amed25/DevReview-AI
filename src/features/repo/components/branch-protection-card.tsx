"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { GitBranch, Shield } from "lucide-react";
import { GITHUB_STATUS_CHECK_CONTEXT } from "@/lib/constants";

type BranchProtectionCardProps = {
  repositoryId: string;
  repoFullName?: string;
};

export function BranchProtectionCard({
  repositoryId,
  repoFullName,
}: BranchProtectionCardProps) {
  const utils = trpc.useUtils();
  const recommendations =
    trpc.automation.getBranchProtectionRecommendations.useQuery({
      repositoryId,
    });

  const dismiss = trpc.automation.dismissRecommendation.useMutation({
    onSuccess: async () => {
      await utils.automation.getBranchProtectionRecommendations.invalidate({
        repositoryId,
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branch protection recommendations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.isLoading ? (
          <p className="text-sm text-muted-foreground">
            Loading recommendations…
          </p>
        ) : (recommendations.data?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active recommendations.
          </p>
        ) : (
          recommendations.data?.map((item) => (
            <div key={item.id} className="rounded border p-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-sm">{item.rule}</p>
                <Badge variant="outline">{item.priority}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{item.rationale}</p>
              <Button
                variant="outline"
                size="sm"
                disabled={dismiss.isPending}
                onClick={() => dismiss.mutate({ recommendationId: item.id })}
              >
                Dismiss
              </Button>
            </div>
          ))
        )}

        <Separator />

        {/* Branch protection setup instructions */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Shield className="size-4 text-muted-foreground" />
            Status check setup
          </div>
          <p className="text-sm text-muted-foreground">
            To block merges when DevReview AI finds issues, add a required
            status check in your GitHub branch protection settings using the
            context name:
          </p>
          <code className="block rounded bg-muted px-3 py-2 text-xs font-mono select-all">
            {GITHUB_STATUS_CHECK_CONTEXT}
          </code>
          <p className="text-xs text-muted-foreground">
            Go to{" "}
            {repoFullName ? (
              <a
                href={`https://github.com/${repoFullName}/settings/branches`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                github.com/{repoFullName}/settings/branches
              </a>
            ) : (
              "your repository → Settings → Branches"
            )}{" "}
            and add a branch protection rule with the context above under{" "}
            <strong>Require status checks to pass before merging</strong>.
          </p>
        </div>

        {repoFullName && (
          <>
            <Separator />
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <GitBranch className="size-4 text-muted-foreground" />
                README badge
              </div>
              <p className="text-sm text-muted-foreground">
                Embed a live review-score badge in your README:
              </p>
              <code className="block rounded bg-muted px-3 py-2 text-xs font-mono break-all select-all">
                {`[![DevReview AI](https://dev-review-ai-chi.vercel.app/api/badge/${repoFullName})](https://dev-review-ai-chi.vercel.app))`}
              </code>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
