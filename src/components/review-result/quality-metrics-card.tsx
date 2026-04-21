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
    <Card className="overflow-hidden border-primary/10">
      <CardContent className="p-0">
        <div className="relative">
          <div className="absolute inset-0 bg-linear-to-br from-primary/3 via-transparent to-primary/2" />
          <div className="relative p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-xl bg-linear-to-br from-primary/15 to-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="size-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between">
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
                    className="size-7 p-0 shrink-0"
                    onClick={copySummary}
                    title="Copy summary"
                  >
                    {copied ? (
                      <Check className="size-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </Button>
                </div>
                <p className="text-sm leading-relaxed text-foreground/80">
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
    <Card className="overflow-hidden border-primary/10">
      <CardContent className="p-0">
        <div className="relative">
          <div className="absolute inset-0 bg-linear-to-br from-primary/3 via-transparent to-primary/2" />
          <div className="relative p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-linear-to-br from-primary/15 to-primary/5 border border-primary/10 flex items-center justify-center">
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
                    Code quality breakdown across 4 dimensions
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
                <div className="text-[10px] text-muted-foreground font-medium">
                  Overall
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {metricItems.map((item) => (
                <div
                  key={item.key}
                  className="group relative rounded-xl border bg-background/50 p-4 transition-all hover:border-primary/20 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-lg bg-muted flex items-center justify-center">
                        <item.icon className="size-3.5 text-muted-foreground" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold">
                          {item.label}
                        </span>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-lg font-bold tabular-nums",
                        getScoreColor(item.score),
                      )}
                    >
                      {item.score}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-2 rounded-full bg-muted/70 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700 ease-out",
                          getBarColor(item.score),
                        )}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                    <div className="flex justify-between">
                      <span
                        className={cn(
                          "text-[10px] font-medium",
                          getScoreColor(item.score),
                        )}
                      >
                        {getScoreLabel(item.score)}
                      </span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {item.score}/100
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {avgConfidence !== null && (
              <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
                <Activity className="size-4 text-muted-foreground shrink-0" />
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
                  <div className="h-1.5 rounded-full bg-muted/70 overflow-hidden">
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
