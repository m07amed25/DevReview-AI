"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnimatedNumber } from "./helpers";
import type React from "react";

export { SEVERITY_COLORS } from "@/lib/constants";
import { SEVERITY_COLORS } from "@/lib/constants";

export function SeverityStatCard({
  label,
  count,
  icon: Icon,
  color,
  active,
  onClick,
}: {
  label: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  color: keyof typeof SEVERITY_COLORS;
  active?: boolean;
  onClick?: () => void;
}) {
  const c = SEVERITY_COLORS[color];
  const animatedCount = useAnimatedNumber(count, 800);

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-300 cursor-pointer select-none",
        c.border,
        count > 0 && `shadow-lg ${c.glow}`,
        active && "ring-2 ring-primary/30 border-primary/30",
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div
            className={cn(
              "size-8 rounded-lg flex items-center justify-center",
              c.bg,
            )}
          >
            <Icon className={cn("size-4", c.icon)} />
          </div>
          <span
            className={cn(
              "text-2xl font-bold tabular-nums tracking-tight",
              count > 0 ? c.text : "text-muted-foreground/40",
            )}
          >
            {animatedCount}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {active && (
            <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
              <Filter className="size-2.5 mr-0.5" />
              Active
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function SeverityDistributionBar({
  counts,
  total,
}: {
  counts: { critical: number; high: number; medium: number; low: number };
  total: number;
}) {
  if (total === 0) {
    return (
      <Card className="overflow-hidden border-emerald-500/15">
        <CardContent className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="h-2.5 flex-1 bg-emerald-500/20 rounded-full overflow-hidden">
              <div
                className="w-full h-full bg-linear-to-r from-emerald-500 to-emerald-400 rounded-full"
                style={{ animation: "shimmer 2s ease-in-out infinite" }}
              />
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
              All Clear
            </span>
          </div>
        </CardContent>
        <style>{`
          @keyframes shimmer {
            0%, 100% { opacity: 0.7; }
            50% { opacity: 1; }
          }
        `}</style>
      </Card>
    );
  }

  const getWidth = (count: number) =>
    Math.max((count / total) * 100, count > 0 ? 4 : 0);

  const segments = [
    {
      key: "critical",
      count: counts.critical,
      color: "bg-red-500",
      label: "Critical",
    },
    { key: "high", count: counts.high, color: "bg-orange-500", label: "High" },
    {
      key: "medium",
      count: counts.medium,
      color: "bg-amber-500",
      label: "Medium",
    },
    {
      key: "low",
      count: counts.low,
      color: "bg-slate-400 dark:bg-slate-500",
      label: "Low",
    },
  ].filter((s) => s.count > 0);

  return (
    <Card className="overflow-hidden">
      <CardContent className="px-5 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Distribution
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {total} total
          </span>
        </div>
        <div className="h-3 bg-muted/50 rounded-full overflow-hidden flex gap-0.5">
          {segments.map((seg) => (
            <div
              key={seg.key}
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out",
                seg.color,
              )}
              style={{ width: `${getWidth(seg.count)}%` }}
              title={`${seg.label}: ${seg.count}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {segments.map((seg) => (
            <div key={seg.key} className="flex items-center gap-1.5">
              <div className={cn("size-2.5 rounded-full", seg.color)} />
              <span className="text-xs text-muted-foreground">{seg.label}</span>
              <span className="text-xs font-bold tabular-nums">
                {seg.count}
              </span>
              <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                ({Math.round((seg.count / total) * 100)}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
