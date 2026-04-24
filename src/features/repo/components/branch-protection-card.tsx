"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type BranchProtectionCardProps = {
  repositoryId: string;
};

export function BranchProtectionCard({ repositoryId }: BranchProtectionCardProps) {
  const utils = trpc.useUtils();
  const recommendations = trpc.automation.getBranchProtectionRecommendations.useQuery({ repositoryId });

  const dismiss = trpc.automation.dismissRecommendation.useMutation({
    onSuccess: async () => {
      await utils.automation.getBranchProtectionRecommendations.invalidate({ repositoryId });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branch protection recommendations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading recommendations…</p>
        ) : (recommendations.data?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">No active recommendations.</p>
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
      </CardContent>
    </Card>
  );
}

