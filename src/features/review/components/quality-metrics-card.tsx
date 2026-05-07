"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  Check,
  Sparkles,
  Activity,
  Zap,
  Paintbrush,
  FileCode2,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { QualityMetrics } from "./types";

export function AISummaryCard({ summary }: { summary: string }) {
  const [copied, setCopied] = useState(false);

  const copySummary = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="overflow-hidden border-border/60">
      <CardContent className="p-0">
        <div className="relative">
          <div className="absolute inset-0 bg-linear-to-br from-primary/3 via-transparent to-transparent pointer-events-none" />
          <div className="relative p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="size-8 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                <Sparkles className="size-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    AI Summary
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-medium"
                    >
                      Auto-generated
                    </Badge>
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-7 p-0 shrink-0 hover:bg-muted"
                    onClick={copySummary}
                    title="Copy summary"
                  >
                    {copied ? (
                      <Check className="size-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="size-3.5 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <p className="text-sm leading-relaxed text-foreground/75">
                  {summary}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ConfidenceBadge({ confidence }: { confidence: number }) {
  const getConfig = (c: number) => {
    if (c >= 90)
      return {
        label: "Very High",
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-500/10 border-emerald-500/20",
      };
    if (c >= 70)
      return {
        label: "High",
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-500/10 border-blue-500/20",
      };
    if (c >= 50)
      return {
        label: "Medium",
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-500/10 border-amber-500/20",
      };
    return {
      label: "Low",
      color: "text-slate-500 dark:text-slate-400",
      bg: "bg-slate-500/10 border-slate-500/20",
    };
  };

  const config = getConfig(confidence);
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] font-medium gap-1 px-2",
        config.bg,
        config.color,
      )}
      title={`AI confidence: ${confidence}%`}
    >
      <Activity className="size-2.5" />
      {confidence}%
    </Badge>
  );
}

export function QualityMetricsCard({
  metrics,
  avgConfidence,
}: {
  metrics: QualityMetrics;
  avgConfidence: number | null;
}) {
  const metricItems = [
    {
      key: "complexity",
      label: "Complexity",
      icon: Zap,
      score: metrics.complexity,
      description: "Code simplicity & structure",
    },
    {
      key: "maintainability",
      label: "Maintainability",
      icon: Paintbrush,
      score: metrics.maintainability,
      description: "Ease of future changes",
    },
    {
      key: "readability",
      label: "Readability",
      icon: FileCode2,
      score: metrics.readability,
      description: "Code clarity & naming",
    },
    {
      key: "testability",
      label: "Testability",
      icon: Shield,
      score: metrics.testability,
      description: "Ease of writing tests",
    },
  ];

  const overallScore = Math.round(
    (metrics.complexity +
      metrics.maintainability +
      metrics.readability +
      metrics.testability) /
      4,
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-blue-500";
    if (score >= 40) return "text-amber-500";
    return "text-red-500";
  };

  const getBarColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Work";
  };

  return (
    <Card className="overflow-hidden border-border/60">
      <CardContent className="p-0">
        <div className="relative">
          <div className="absolute inset-0 bg-linear-to-br from-primary/3 via-transparent to-transparent pointer-events-none" />
          <div className="relative p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center">
                  <Activity className="size-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    Quality Metrics
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-medium"
                    >
                      AI-Scored
                    </Badge>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    4-dimension code quality breakdown
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={cn(
                    "text-2xl font-bold tabular-nums",
                    getScoreColor(overallScore),
                  )}
                >
                  {overallScore}
                </div>
                <div className="text-[10px] text-muted-foreground/70 font-semibold uppercase tracking-wider">
                  avg score
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {metricItems.map((item) => (
                <div
                  key={item.key}
                  className="rounded-xl border border-border/50 bg-muted/20 p-3.5 hover:border-border/80 hover:bg-muted/30 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-md bg-muted/60 flex items-center justify-center">
                        <item.icon className="size-3 text-muted-foreground/80" />
                      </div>
                      <span className="text-xs font-semibold text-foreground/90">
                        {item.label}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "text-base font-bold tabular-nums",
                        getScoreColor(item.score),
                      )}
                    >
                      {item.score}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700 ease-out",
                          getBarColor(item.score),
                        )}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-muted-foreground/70">
                        {item.description}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-semibold",
                          getScoreColor(item.score),
                        )}
                      >
                        {getScoreLabel(item.score)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {avgConfidence !== null && (
              <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/20 px-4 py-3">
                <Activity className="size-3.5 text-muted-foreground/60 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      Avg. AI Confidence
                    </span>
                    <span
                      className={cn(
                        "text-xs font-bold tabular-nums",
                        getScoreColor(avgConfidence),
                      )}
                    >
                      {avgConfidence}%
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-muted/70 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700 ease-out",
                        getBarColor(avgConfidence),
                      )}
                      style={{ width: `${avgConfidence}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
