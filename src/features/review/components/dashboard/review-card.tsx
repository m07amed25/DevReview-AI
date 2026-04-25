"use client";

import React, { useRef } from "react";
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
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  STATUS_CONFIG,
  type ReviewStatus,
  type ViewMode,
  type ReviewComment,
} from "../../types/dashboard";
import { relativeTime, isRecentlyCompleted, getRiskLevel } from "../../utils/dashboard-helpers";
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
  const cardRef = useRef<HTMLDivElement>(null);
  const status = review.status as ReviewStatus;
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;
  const comments = (
    Array.isArray(review.comments) ? review.comments : []
  ) as ReviewComment[];
  const qualityScore = computeQualityScore(review.qualityMetrics);
  const recent =
    status === "COMPLETED" && isRecentlyCompleted(review.createdAt);

  useGSAP(
    () => {
      if (!cardRef.current) return;
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 15, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.4,
          delay: Math.min(index * 0.04, 0.4),
          ease: "power2.out",
        },
      );
    },
    { scope: cardRef, dependencies: [index] },
  );

  if (viewMode === "grid") {
    return (
      <div ref={cardRef}>
        <Link
          href={`/repo/${review.repositoryId}/pr/${review.prNumber}`}
          className="group block h-full"
        >
          <Card
            className={cn(
              "relative h-full overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300",
              "hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1",
              recent && "ring-1 ring-emerald-500/30",
            )}
          >
            <div
              className={cn(
                "absolute inset-x-0 top-0 h-1 bg-linear-to-r",
                config.gradient,
              )}
            />
            <div className="absolute inset-0 bg-linear-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/3 group-hover:to-transparent transition-all duration-500" />
            <CardContent className="relative p-4 pt-5 flex flex-col h-full">
              <div className="flex items-start justify-between gap-2 mb-3">
                <Badge
                  variant="outline"
                  className="shrink-0 font-mono text-[10px] px-1.5 py-0 h-5"
                >
                  #{review.prNumber}
                </Badge>
                {status === "COMPLETED" && review.riskScore != null ? (
                  <MiniRiskGauge score={review.riskScore} size={36} />
                ) : (
                  <div
                    className={cn(
                      "flex size-8 items-center justify-center rounded-lg ring-1",
                      config.bg,
                      config.ring,
                    )}
                  >
                    <StatusIcon
                      className={cn(
                        "size-4",
                        config.color,
                        status === "PROCESSING" && "animate-spin",
                      )}
                    />
                  </div>
                )}
              </div>
              <h3 className="text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                {review.prTitle}
              </h3>
              {status === "COMPLETED" && review.summary && (
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                  {review.summary}
                </p>
              )}
              {status === "FAILED" && review.error && (
                <p className="text-[11px] text-red-400/80 line-clamp-2 mb-3 flex items-start gap-1">
                  <AlertTriangle className="size-3 shrink-0 mt-0.5" />
                  {review.error}
                </p>
              )}
              <div className="flex-1" />
              <div className="space-y-2 pt-3 border-t border-border/30">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <FolderGit2 className="size-3" />
                    <span className="truncate max-w-24">
                      {review.repository.name}
                    </span>
                  </span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {relativeTime(review.createdAt)}
                  </span>
                </div>
                {status === "COMPLETED" && comments.length > 0 && (
                  <SeverityDonut comments={comments} />
                )}
                {status === "COMPLETED" && qualityScore !== null && (
                  <QualityScorePill score={qualityScore} />
                )}
              </div>
              {recent && (
                <div className="absolute top-3 right-3">
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] px-1.5 py-0 gap-1">
                    <Zap className="size-2.5" />
                    New
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>
    );
  }

  return (
    <div ref={cardRef}>
      <Link
        href={`/repo/${review.repositoryId}/pr/${review.prNumber}`}
        className="group block"
      >
        <Card
          className={cn(
            "relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300",
            "hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5",
            recent && "ring-1 ring-emerald-500/30",
          )}
        >
          <div
            className={cn(
              "absolute left-0 top-0 h-full w-0.75 transition-all duration-300 group-hover:w-1",
              config.dot,
            )}
          />
          <div className="absolute inset-0 bg-linear-to-r from-primary/0 to-primary/0 group-hover:from-primary/2 group-hover:to-transparent transition-all duration-500" />
          <CardContent className="relative p-4 pl-5 sm:p-5 sm:pl-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="hidden sm:block shrink-0 pt-0.5">
                {status === "COMPLETED" && review.riskScore != null ? (
                  <MiniRiskGauge score={review.riskScore} />
                ) : (
                  <div
                    className={cn(
                      "flex size-11 items-center justify-center rounded-xl ring-1 transition-all duration-300 group-hover:scale-105 group-hover:shadow-md",
                      config.bg,
                      config.ring,
                    )}
                  >
                    <StatusIcon
                      className={cn(
                        "size-5",
                        config.color,
                        status === "PROCESSING" && "animate-spin",
                      )}
                    />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className="shrink-0 font-mono text-[10px] px-1.5 py-0 h-5"
                      >
                        #{review.prNumber}
                      </Badge>
                      <h3 className="text-sm font-semibold leading-tight text-foreground group-hover:text-primary transition-colors truncate">
                        {review.prTitle}
                      </h3>
                      {recent && (
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] px-1.5 py-0 gap-1 animate-pulse">
                          <Zap className="size-2.5" />
                          New
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2.5 flex-wrap text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FolderGit2 className="size-3 shrink-0" />
                        <span className="truncate max-w-40">
                          {review.repository.fullName}
                        </span>
                      </span>
                      <span className="text-muted-foreground/30">|</span>
                      <span className="flex items-center gap-1 tabular-nums">
                        <Calendar className="size-3 shrink-0" />
                        {relativeTime(review.createdAt)}
                      </span>
                      {status === "COMPLETED" && comments.length > 0 && (
                        <>
                          <span className="text-muted-foreground/30">|</span>
                          <span className="flex items-center gap-1 tabular-nums">
                            <Eye className="size-3 shrink-0" />
                            {comments.length} issue
                            {comments.length !== 1 ? "s" : ""}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={cn(
                        "gap-1 text-[11px] font-medium ring-1",
                        config.color,
                        config.bg,
                        config.ring,
                      )}
                    >
                      <StatusIcon
                        className={cn(
                          "size-3",
                          status === "PROCESSING" && "animate-spin",
                        )}
                      />
                      {config.label}
                    </Badge>
                    {status === "COMPLETED" && review.riskScore != null && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "gap-1 text-[11px] font-medium ring-1",
                          getRiskLevel(review.riskScore).color,
                          `${getRiskLevel(review.riskScore).bg}/10`,
                        )}
                      >
                        {getRiskLevel(review.riskScore).label} Risk
                      </Badge>
                    )}
                  </div>
                </div>
                {status === "COMPLETED" && review.summary && (
                  <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed pr-4">
                    {review.summary}
                  </p>
                )}
                {status === "FAILED" && review.error && (
                  <p className="text-xs text-red-400/80 line-clamp-1 flex items-center gap-1">
                    <AlertTriangle className="size-3 shrink-0" />
                    {review.error}
                  </p>
                )}
                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        "sm:hidden gap-1 text-[10px] font-medium ring-1",
                        config.color,
                        config.bg,
                        config.ring,
                      )}
                    >
                      <StatusIcon
                        className={cn(
                          "size-3",
                          status === "PROCESSING" && "animate-spin",
                        )}
                      />
                      {config.label}
                    </Badge>
                    {status === "COMPLETED" && comments.length > 0 && (
                      <SeverityDonut comments={comments} />
                    )}
                    {status === "COMPLETED" && qualityScore !== null && (
                      <QualityScorePill score={qualityScore} />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
                    <span>View details</span>
                    <ChevronRight className="size-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
