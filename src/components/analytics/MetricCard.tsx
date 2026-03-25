import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { COLORS } from "./analytics.types";
import { AnimatedNumber } from "./AnimatedNumber";

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = COLORS.primary,
  trend,
  trendValue,
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ElementType;
  color?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}) {
  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p
            className="mt-2 text-3xl font-bold tracking-tight"
            style={{ color }}
          >
            <AnimatedNumber
              value={
                typeof value === "number" ? value : parseFloat(String(value))
              }
            />
            {typeof value === "string" && value.includes("%") && "%"}
          </p>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div
          className="flex h-12 w-12 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="h-6 w-6" style={{ color }} />
        </div>
      </div>
      {trend && trendValue && (
        <div
          className={cn(
            "mt-4 flex items-center gap-1 text-sm font-medium",
            trend === "up"
              ? "text-green-600 dark:text-green-400"
              : trend === "down"
                ? "text-red-600 dark:text-red-400"
                : "text-muted-foreground",
          )}
        >
          {trend === "up" ? (
            <TrendingUp className="h-4 w-4" />
          ) : trend === "down" ? (
            <TrendingDown className="h-4 w-4" />
          ) : null}
          <span>{trendValue}</span>
        </div>
      )}
    </Card>
  );
}

export function MetricCardSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-2 h-10 w-16" />
          <Skeleton className="mt-2 h-3 w-32" />
        </div>
        <Skeleton className="h-12 w-12 rounded-lg" />
      </div>
    </Card>
  );
}
