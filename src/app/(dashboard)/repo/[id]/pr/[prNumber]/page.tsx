"use client";

import { use, useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  GitPullRequest,
  GitMerge,
  ExternalLink,
  Clock,
  Plus,
  Minus,
  FileText,
  XCircle,
  CheckCircle,
  Loader2,
  Sparkles,
  GitBranch,
  ArrowRight,
  Wand2,
  ScanSearch,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{
    id: string;
    prNumber: string;
  }>;
};

export default function PullRequestPage({ params }: PageProps) {
  const { id, prNumber } = use(params);
  const prNum = parseInt(prNumber, 10);

  const pr = trpc.pullRequest.get.useQuery(
    {
      repositoryId: id,
      prNumber: prNum,
    },
    {
      enabled: !!id && !isNaN(prNum),
    },
  );

  const files = trpc.pullRequest.files.useQuery(
    {
      repositoryId: id,
      prNumber: prNum,
    },
    {
      enabled: !!id && !isNaN(prNum),
    },
  );

  if (pr.isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="size-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-96" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (pr.isError || !pr.data) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <div className="mx-auto size-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="size-6 text-destructive" />
          </div>
          <p className="mt-4 font-medium text-destructive">
            {pr.error?.message || "Failed to load pull request data."}
          </p>
          <Link href={`/repo/${id}`} className="mt-6 inline-block">
            <Button variant={"outline"}>
              <ArrowLeft className="size-4 mr-2" />
              Back to Repository
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const isMerged = pr.data.state === "closed" && pr.data.mergedAt;

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <Link href={`/repo/${id}`}>
          <Button variant={"outline"} className="shrink-0 mt-1" size={"icon"}>
            <ArrowLeft className="size-4" />
          </Button>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <div
                  className={cn(
                    "p-2 rounded-lg shrink-0",
                    isMerged
                      ? "bg-purple-500/10"
                      : pr.data.state === "closed"
                        ? "bg-red-500/10"
                        : "bg-emerald-500/10",
                  )}
                >
                  {isMerged ? (
                    <GitMerge className="size-5 text-purple-500" />
                  ) : pr.data.state === "closed" ? (
                    <XCircle className="size-5 text-red-500" />
                  ) : (
                    <GitPullRequest className="size-5 text-emerald-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-semibold tracking-tight truncate">
                    {pr.data.title}
                  </h1>
                  <div className="flex items gap-2 mt-1 flex-wrap">
                    <PRStatusBadge
                      state={pr.data.state}
                      isMerged={isMerged}
                      draft={pr.data.draft}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PRStatusBadge({
  state,
  isMerged,
  draft,
}: {
  state: string;
  isMerged: boolean;
  draft: boolean;
}) {
  if (draft) {
    return (
      <Badge variant={"secondary"} className="gap-1">
        Draft
      </Badge>
    );
  }

  if (isMerged) {
    return (
      <Badge variant={"secondary"} className="gap-1">
        Merged
      </Badge>
    );
  }
}
