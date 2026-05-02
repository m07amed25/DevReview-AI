"use client";

import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  FolderGit2,
  Calendar,
  Eye,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  STATUS_CONFIG,
  type ReviewStatus,
  type ViewMode,
  type ReviewComment,
} from "../../types/dashboard";
import {
  relativeTime,
  isRecentlyCompleted,
  getRiskLevel,
} from "../../utils/dashboard-helpers";
import {
  MiniRiskGauge,
  SeverityDonut,
  QualityScorePill,
} from "./chart-components";

type ReviewData = {
  id: string;
  repositoryId: string;
  prNumber: number;
  prTitle: string;
  prUrl: string;
  status: string;
  summary?: string | null;
  riskScore?: number | null;
  comments?: unknown;
  qualityMetrics?: unknown;
  error?: string | null;
  createdAt: string | Date;
  repository: { id: string; name: string; fullName: string; private: boolean };
};

function computeQualityScore(qualityMetrics: unknown): number | null {
  if (
    qualityMetrics &&
    typeof qualityMetrics === "object" &&
    !Array.isArray(qualityMetrics) &&
    "complexity" in (qualityMetrics as Record<string, unknown>)
  ) {
    const qm = qualityMetrics as {
      complexity: number;
      maintainability: number;
      readability: number;
      testability: number;
    };
    return Math.round(
      (qm.complexity + qm.maintainability + qm.readability + qm.testability) /
        4,
    );
  }
  return null;
}

export function ReviewCard({
  review,
  index,
  viewMode,
}: {
  review: ReviewData;
  index: number;
  viewMode: ViewMode;
}) {
  const status = review.status as ReviewStatus;
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;
  const comments = (
    Array.isArray(review.comments) ? review.comments : []
  ) as ReviewComment[];
  const qualityScore = computeQualityScore(review.qualityMetrics);
  const recent =
    status === "COMPLETED" && isRecentlyCompleted(review.createdAt);

  if (viewMode === "grid") {
    return (
      <div className="h-full">
        <Link
          href={`/repo/${review.repositoryId}/pr/${review.prNumber}`}
          className="group block h-full"
        >
          <Card
            className={cn(
              "h-full border bg-card transition-colors hover:border-primary/30 hover:bg-muted/5",
              recent && "border-emerald-500/30"
            )}
          >
            <CardContent className="p-4 flex flex-col h-full">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] font-bold font-mono text-muted-foreground/60">
                  #{review.prNumber}
                </span>
                <div className={cn("size-2 rounded-full", config.color.split(' ')[0].replace('text-', 'bg-'))} />
              </div>
              
              <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2 leading-snug">
                {review.prTitle}
              </h3>
              
              <div className="flex-1" />
              
              <div className="mt-4 pt-4 border-t border-border/40 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="truncate max-w-[120px] font-medium">
                    {review.repository.name}
                  </span>
                  <span className="tabular-nums opacity-70">
                    {relativeTime(review.createdAt)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {status === "COMPLETED" && review.riskScore != null && (
                    <div className={cn(
                      "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                      getRiskLevel(review.riskScore).color,
                      "bg-muted/50"
                    )}>
                      {getRiskLevel(review.riskScore).label}
                    </div>
                  )}
                  {status === "COMPLETED" && comments.length > 0 && (
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {comments.length} issues
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Link
        href={`/repo/${review.repositoryId}/pr/${review.prNumber}`}
        className="group block"
      >
        <div
          className={cn(
            "flex items-center gap-4 p-4 border rounded-xl bg-card transition-all duration-200 hover:border-primary/30 hover:bg-muted/5",
            recent && "border-emerald-500/20"
          )}
        >
          {/* Status Icon Column */}
          <div className="shrink-0">
            <div className={cn(
              "flex size-9 items-center justify-center rounded-lg",
              config.bg,
              "opacity-80"
            )}>
              <StatusIcon className={cn("size-4", config.color, status === "PROCESSING" && "animate-spin")} />
            </div>
          </div>

          {/* Main Content Column */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold font-mono text-muted-foreground/50 tracking-tighter shrink-0">
                #{review.prNumber}
              </span>
              <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {review.prTitle}
              </h3>
              {recent && (
                <span className="flex size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              )}
            </div>
            
            <div className="mt-1 flex items-center gap-4 text-[11px] text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5">
                <FolderGit2 className="size-3 text-muted-foreground/40" />
                {review.repository.fullName}
              </span>
              <span className="flex items-center gap-1.5 opacity-60">
                <Calendar className="size-3" />
                {relativeTime(review.createdAt)}
              </span>
            </div>
          </div>

          {/* Metrics & Badges Column */}
          <div className="flex items-center gap-6 shrink-0 hidden md:flex">
            {status === "COMPLETED" && comments.length > 0 && (
              <div className="flex items-center gap-2">
                <SeverityDonut comments={comments} />
                <span className="text-[11px] font-bold text-muted-foreground tabular-nums">
                  {comments.length}
                </span>
              </div>
            )}
            
            {status === "COMPLETED" && review.riskScore != null && (
              <div className="flex flex-col items-end gap-1">
                <div className={cn(
                  "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
                  getRiskLevel(review.riskScore).color,
                  "bg-muted/50 border border-border/50"
                )}>
                  {getRiskLevel(review.riskScore).label}
                </div>
                <div className="h-1 w-12 rounded-full bg-muted overflow-hidden">
                  <div className={cn("h-full", getRiskLevel(review.riskScore).bg)} style={{ width: `${review.riskScore * 10}%` }} />
                </div>
              </div>
            )}

            {status !== "COMPLETED" && (
              <Badge variant="outline" className={cn("rounded-lg border-border/60 text-[10px] font-bold uppercase tracking-wider", config.bg, config.color)}>
                {config.label}
              </Badge>
            )}

            <ChevronRight className="size-4 text-muted-foreground/30 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </div>
  );
}

export function ReviewCardSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === "grid") {
    return (
      <Card className="border-border/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-5 w-12 rounded-md" />
            <Skeleton className="size-9 rounded-lg" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="pt-2 border-t border-border/30 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="border-border/50">
      <CardContent className="p-5 pl-6">
        <div className="flex items-start gap-4">
          <Skeleton className="hidden sm:block size-11 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-12 rounded-md" />
              <Skeleton className="h-4 w-52" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-3 w-full max-w-md" />
            <div className="flex items-center gap-2">
              <Skeleton className="size-6 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="hidden sm:flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
