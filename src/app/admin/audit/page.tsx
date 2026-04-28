"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { trpc } from "@/lib/trpc";

function actionLabel(actionType: string): string {
  return actionType
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = trpc.admin.getAuditLogs.useQuery({
    page,
    limit: 20,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">
          Track all team actions and administrative decisions across the
          platform.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Action History</CardTitle>
          <CardDescription>
            A chronological record of approved and rejected team actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !data?.logs.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Activity className="h-8 w-8" />
              <p className="text-sm">No audit events recorded yet.</p>
            </div>
          ) : (
            <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-muted">
              {data.logs.map((log) => (
                <div key={log.id} className="relative flex items-start gap-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background border shadow-sm z-10">
                    <Activity className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex flex-1 flex-col gap-1 pt-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-sm font-semibold">
                        {actionLabel(log.actionType)}
                        {" — "}
                        <span className="font-normal text-muted-foreground">
                          {log.teamName}
                        </span>
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            log.status === "APPROVED"
                              ? "default"
                              : log.status === "REJECTED"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {log.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Requested by{" "}
                      <span className="text-foreground font-medium">
                        {log.requestedBy.name || log.requestedBy.email}
                      </span>
                      {log.resolvedBy && (
                        <>
                          {" · Resolved by "}
                          <span className="text-foreground font-medium">
                            {log.resolvedBy.name || log.resolvedBy.email}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {data && data.pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {page} of {data.pages} · {data.total} total events
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                  disabled={page >= data.pages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
