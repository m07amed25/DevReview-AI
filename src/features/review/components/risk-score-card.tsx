"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Activity, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRiskConfig, useAnimatedNumber, timeAgo } from "./helpers";

export function RiskScoreCard({
  score,
  totalIssues,
  createdAt,
}: {
  score: number;
  totalIssues: number;
  createdAt?: Date;
}) {
  const config = getRiskConfig(score);
  const RiskIcon = config.icon;
  const animatedScore = useAnimatedNumber(score, 1000);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 30% 0%, ${config.glowColor}08 0%, transparent 60%), radial-gradient(ellipse at 70% 100%, ${config.glowColor}05 0%, transparent 60%)`,
            }}
          />
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
              {/* Circular gauge */}
              <div className="relative shrink-0">
                <svg className="size-36 -rotate-90" viewBox="0 0 128 128">
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    fill="none"
                    strokeWidth="8"
                    className="stroke-muted/30"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    fill="none"
                    strokeWidth="8"
                    strokeLinecap="round"
                    stroke={config.markerColor}
                    style={{
                      strokeDasharray: circumference,
                      strokeDashoffset,
                      transition:
                        "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  />
                  <defs>
                    <filter id="riskGlow">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    fill="none"
                    strokeWidth="8"
                    strokeLinecap="round"
                    stroke={config.markerColor}
                    filter="url(#riskGlow)"
                    opacity="0.3"
                    style={{
                      strokeDasharray: circumference,
                      strokeDashoffset,
                      transition:
                        "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className={cn(
                      "text-4xl font-bold tabular-nums tracking-tighter",
                      config.color,
                    )}
                  >
                    {animatedScore}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium -mt-0.5">
                    / 100
                  </span>
                </div>
              </div>

              {/* Right side info */}
              <div className="flex-1 text-center sm:text-left space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <div
                      className={cn(
                        "size-8 rounded-lg flex items-center justify-center",
                        config.bg,
                      )}
                    >
                      <RiskIcon className={cn("size-4", config.color)} />
                    </div>
                    <h3 className={cn("text-lg font-bold", config.color)}>
                      {config.label}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {config.description}
                  </p>
                </div>
                <div className="flex items-center gap-4 justify-center sm:justify-start flex-wrap">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Activity className="size-3.5 text-muted-foreground" />
                    <span className="font-semibold tabular-nums">
                      {totalIssues}
                    </span>
                    <span className="text-muted-foreground">
                      {totalIssues === 1 ? "issue" : "issues"} found
                    </span>
                  </div>
                  {createdAt && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="size-3.5" />
                      <span>{timeAgo(createdAt)}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="relative h-2 rounded-full overflow-hidden bg-muted/50">
                    <div className="absolute inset-0 rounded-full bg-linear-to-r from-emerald-500 via-amber-500 to-red-500 opacity-20" />
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-emerald-500 via-amber-500 to-red-500"
                      style={{
                        width: `${score}%`,
                        transition: "width 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    />
                    <div
                      className="absolute top-1/2 size-3.5 rounded-full bg-background border-2 shadow-md"
                      style={{
                        left: `${Math.min(Math.max(score, 2), 98)}%`,
                        transform: "translateX(-50%) translateY(-50%)",
                        borderColor: config.markerColor,
                        transition: "left 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium">
                      Safe
                    </span>
                    <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium">
                      Critical
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
