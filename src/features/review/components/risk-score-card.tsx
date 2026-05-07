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
    <Card className="overflow-hidden border-border/60">
      <CardContent className="p-0">
        <div className="relative">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 20% 0%, ${config.glowColor}0a 0%, transparent 55%), radial-gradient(ellipse at 80% 100%, ${config.glowColor}06 0%, transparent 55%)`,
            }}
          />
          <div className="relative p-5 sm:p-7">
            <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-8">
              {/* Circular gauge */}
              <div className="relative shrink-0">
                <svg className="size-32 -rotate-90" viewBox="0 0 128 128">
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    fill="none"
                    strokeWidth="7"
                    className="stroke-muted/40"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    fill="none"
                    strokeWidth="7"
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
                    strokeWidth="7"
                    strokeLinecap="round"
                    stroke={config.markerColor}
                    filter="url(#riskGlow)"
                    opacity="0.25"
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
                      "text-3xl font-bold tabular-nums tracking-tight",
                      config.color,
                    )}
                  >
                    {animatedScore}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider -mt-0.5">
                    / 100
                  </span>
                </div>
              </div>

              {/* Right side info */}
              <div className="flex-1 text-center sm:text-left space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 justify-center sm:justify-start">
                    <div
                      className={cn(
                        "size-8 rounded-lg flex items-center justify-center shrink-0",
                        config.bg,
                      )}
                    >
                      <RiskIcon className={cn("size-4", config.color)} />
                    </div>
                    <div>
                      <h3 className={cn("text-base font-bold", config.color)}>
                        {config.label} Risk
                      </h3>
                      <p className="text-xs text-muted-foreground leading-snug">
                        {config.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 justify-center sm:justify-start flex-wrap">
                  <div className="flex items-center gap-1.5 text-sm bg-muted/40 border border-border/40 rounded-lg px-2.5 py-1">
                    <Activity className="size-3.5 text-muted-foreground" />
                    <span className="font-bold tabular-nums">
                      {totalIssues}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {totalIssues === 1 ? "issue" : "issues"}
                    </span>
                  </div>
                  {createdAt && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3.5" />
                      <span>{timeAgo(createdAt)}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="relative h-2 rounded-full overflow-hidden bg-muted/60">
                    <div className="absolute inset-0 rounded-full bg-linear-to-r from-emerald-500 via-amber-500 to-red-500 opacity-15" />
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-emerald-500 via-amber-500 to-red-500"
                      style={{
                        width: `${score}%`,
                        transition: "width 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    />
                    <div
                      className="absolute top-1/2 size-3 rounded-full bg-background border-2 shadow-sm"
                      style={{
                        left: `${Math.min(Math.max(score, 1.5), 98.5)}%`,
                        transform: "translateX(-50%) translateY(-50%)",
                        borderColor: config.markerColor,
                        transition: "left 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-semibold">
                      Safe
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-semibold">
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
