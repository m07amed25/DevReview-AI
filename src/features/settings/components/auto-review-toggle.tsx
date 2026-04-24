"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type AutoReviewToggleProps = {
  repositoryId: string;
};

export function AutoReviewToggle({ repositoryId }: AutoReviewToggleProps) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.repository.getWebhookConfig.useQuery({ repositoryId });

  const update = trpc.repository.updateWebhookConfig.useMutation({
    onSuccess: async (result) => {
      await utils.repository.getWebhookConfig.invalidate({ repositoryId });
      window.alert(`Auto-review ${result.enabled ? "enabled" : "disabled"}.`);
    },
    onError: (error) => {
      window.alert(error.message || "Failed to update auto-review setting.");
    },
  });

  const enabled = update.variables?.enabled ?? data?.enabled ?? false;

  const disabled = isLoading || update.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Automatic Pull Request Reviews</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Checkbox
            id={`auto-review-${repositoryId}`}
            checked={enabled}
            disabled={disabled}
            onCheckedChange={(value) => {
              const next = value === true;
              update.mutate({ repositoryId, enabled: next });
            }}
          />
          <Label htmlFor={`auto-review-${repositoryId}`}>
            Enable webhook-triggered reviews for this repository
          </Label>
        </div>
      </CardContent>
    </Card>
  );
}


