"use client";

import React, { useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
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
import { DropdownSelect, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Download,
  RefreshCw,
  Activity,
  ShieldCheck,
  Bug,
  Code2,
  Zap,
  FileText,
  ArrowUpRight,
  AlertCircle,
  Search,
  ArrowUpDown,
  Database,
  Circle,
  CheckCircle,
  X,
} from "lucide-react";

type TimePeriod = "7d" | "30d" | "90d" | "6m" | "1y";

const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "6m": "Last 6 months",
  "1y": "Last year",
};

// Color palette
const COLORS = {
  primary: "#3b82f6",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#8b5cf6",
  dark: "#1e293b",
  muted: "#64748b",
};

interface TrendDataPoint {
  date: string;
  total: number;
  completed: number;
  pending: number;
  failed: number;
}

// Simple number display
function AnimatedNumber({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  return (
    <span>
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}

// Metric card component
function MetricCard({
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

function MetricCardSkeleton() {
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

// Interactive line chart
function InteractiveLineChart({
  data,
  dataKey,
  color = COLORS.primary,
  height = 300,
}: {
  data: TrendDataPoint[];
  dataKey: keyof TrendDataPoint;
  color?: string;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const points = useMemo(() => {
    if (data.length === 0) return [];
    const max = Math.max(...data.map((d) => Number(d[dataKey])), 1);
    const width = 100;
    const heightVal = 100;
    const padding = 10;

    return data.map((item, index) => {
      const x =
        (index / Math.max(data.length - 1, 1)) * (width - padding * 2) +
        padding;
      const y =
        heightVal -
        padding -
        (Number(item[dataKey]) / max) * (heightVal - padding * 2);
      return { x, y, ...item };
    });
  }, [data, dataKey]);

  const pathD = useMemo(() => {
    if (points.length === 0) return "";
    return points.reduce((acc, point, i) => {
      if (i === 0) return `M ${point.x} ${point.y}`;
      return `${acc} L ${point.x} ${point.y}`;
    }, "");
  }, [points]);

  const areaD = useMemo(() => {
    if (points.length === 0) return "";
    const path = pathD;
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    return `${path} L ${lastPoint.x} 100 L ${firstPoint.x} 100 Z`;
  }, [pathD, points]);

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground"
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative" style={{ height }}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
        style={{ height }}
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke="currentColor"
            strokeWidth="0.1"
            className="text-muted/20"
          />
        ))}

        {/* Area gradient */}
        <defs>
          <linearGradient
            id={`gradient-${dataKey}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area */}
        <path
          d={areaD}
          fill={`url(#gradient-${dataKey})`}
          className="transition-all duration-300"
        />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="0.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-300"
        />

        {/* Points */}
        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r={hoveredIndex === index ? "1.5" : "0.6"}
              fill={color}
              className="transition-all duration-200 cursor-pointer"
              style={{ opacity: hoveredIndex === index ? 1 : 0.6 }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
            {hoveredIndex === index && (
              <circle
                cx={point.x}
                cy={point.y}
                r="2.5"
                fill="none"
                stroke={color}
                strokeWidth="0.3"
                className="animate-pulse"
              />
            )}
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      {hoveredIndex !== null && points[hoveredIndex] && (
        <div
          className="absolute z-10 bg-popover border border-border rounded-lg px-3 py-2 shadow-lg pointer-events-none"
          style={{
            left: `${points[hoveredIndex].x}%`,
            top: `${points[hoveredIndex].y}%`,
            transform: "translate(-50%, -120%)",
          }}
        >
          <div className="text-xs text-muted-foreground">
            {points[hoveredIndex].date}
          </div>
          <div className="text-sm font-semibold">
            {Number(points[hoveredIndex][dataKey])}
          </div>
        </div>
      )}
    </div>
  );
}

// Donut chart with animation
function AnimatedDonutChart({
  data,
  size = 200,
}: {
  data: Array<{ label: string; value: number; color: string }>;
  size?: number;
}) {
  const chartRef = useRef<SVGSVGElement>(null);

  const total = useMemo(() => {
    return data.reduce((sum, d) => sum + d.value, 0);
  }, [data]);

  const segments = useMemo(() => {
    if (total === 0) return [];
    let currentAngle = -90;

    return data.map((item) => {
      const percentage = item.value / total;
      const angle = percentage * 360;
      const startAngle = currentAngle;
      currentAngle += angle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = ((startAngle + angle) * Math.PI) / 180;

      const radius = size / 2 - 15;
      const center = size / 2;

      const x1 = center + radius * Math.cos(startRad);
      const y1 = center + radius * Math.sin(startRad);
      const x2 = center + radius * Math.cos(endRad);
      const y2 = center + radius * Math.sin(endRad);

      const largeArcFlag = angle > 180 ? 1 : 0;

      const pathData = [
        `M ${center} ${center}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        "Z",
      ].join(" ");

      return {
        path: pathData,
        color: item.color,
        label: item.label,
        percentage: Math.round(percentage * 100),
        value: item.value,
      };
    });
  }, [data, total, size]);

  if (total === 0) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground"
        style={{ width: size, height: size }}
      >
        No data
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <svg ref={chartRef} width={size} height={size}>
        {segments.map((segment, index) => (
          <path
            key={index}
            d={segment.path}
            fill={segment.color}
            className="transition-all duration-300 hover:opacity-80 cursor-pointer"
          />
        ))}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 35}
          fill="var(--card)"
        />
        <text
          x={size / 2}
          y={size / 2 - 8}
          textAnchor="middle"
          className="fill-foreground text-xl font-bold"
        >
          {total}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 12}
          textAnchor="middle"
          className="fill-muted-foreground text-xs"
        >
          Total
        </text>
      </svg>
      <div className="flex flex-col gap-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-muted-foreground">{item.label}</span>
            <span className="text-sm font-semibold">
              {Math.round((item.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Data table with sorting
function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  title,
}: {
  data: T[];
  columns: {
    key: keyof T;
    label: string;
    sortable?: boolean;
    render?: (item: T) => React.ReactNode;
  }[];
  title?: string;
}) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [searchTerm, setSearchTerm] = useState("");

  const sortedData = useMemo(() => {
    let filtered = data;

    if (searchTerm) {
      filtered = data.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      );
    }

    if (!sortKey) return filtered;

    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDir === "asc"
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }, [data, sortKey, sortDir, searchTerm]);

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="space-y-4">
      {title && <h3 className="text-lg font-semibold">{title}</h3>}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      <div className="overflow-x-auto rounded-xl border border-border/50">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                    col.sortable &&
                      "cursor-pointer hover:text-foreground transition-colors",
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {col.sortable &&
                      sortKey === col.key &&
                      (sortDir === "asc" ? (
                        <ArrowUpDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 rotate-180" />
                      ))}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, index) => (
              <tr
                key={index}
                className="border-b border-border/30 hover:bg-muted/20 transition-colors"
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-4 py-3 text-sm">
                    {col.render
                      ? col.render(item)
                      : String(item[col.key] ?? "-")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Alert banner
function AnomalyAlert({
  severity,
  message,
  onDismiss,
}: {
  severity: "warning" | "critical";
  message: string;
  onDismiss?: () => void;
}) {
  const isCritical = severity === "critical";

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-lg border",
        isCritical
          ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
          : "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400",
      )}
    >
      <AlertCircle className="h-5 w-5 shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      <Badge
        variant="outline"
        className={cn(
          "shrink-0",
          isCritical
            ? "border-red-300 dark:border-red-700 text-red-700 dark:text-red-400"
            : "border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400",
        )}
      >
        {isCritical ? "Critical" : "Warning"}
      </Badge>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors"
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("30d");
  const [selectedReviewer, setSelectedReviewer] = useState<string>("all");
  const [granularity, setGranularity] = useState<
    "daily" | "weekly" | "monthly"
  >("daily");
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const { data: overviewData, isLoading: overviewLoading } =
    trpc.analytics.getOverview.useQuery({ timePeriod });
  const { data: trendsData, isLoading: trendsLoading } =
    trpc.analytics.getTrends.useQuery({ timePeriod, granularity });
  const { data: ratesData, isLoading: ratesLoading } =
    trpc.analytics.getApprovalRejectionRates.useQuery({ timePeriod });
  const { data: workloadData, isLoading: workloadLoading } =
    trpc.analytics.getReviewerWorkload.useQuery({ timePeriod });
  const { data: qualityData, isLoading: qualityLoading } =
    trpc.analytics.getQualityScores.useQuery({ timePeriod });
  const { data: issuesData, isLoading: issuesLoading } =
    trpc.analytics.getTopIssues.useQuery({ timePeriod, limit: 10 });
  const { data: anomaliesData, isLoading: anomaliesLoading } =
    trpc.analytics.getAnomalies.useQuery({ timePeriod });

  const handleExport = useCallback(() => {
    const exportData = {
      overview: overviewData,
      trends: trendsData,
      rates: ratesData,
      workload: workloadData,
      quality: qualityData,
      issues: issuesData,
      exportedAt: new Date().toISOString(),
      period: timePeriod,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-report-${timePeriod}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [
    overviewData,
    trendsData,
    ratesData,
    workloadData,
    qualityData,
    issuesData,
    timePeriod,
  ]);

  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  const dismissAlert = (type: string) => {
    setDismissedAlerts((prev) => [...prev, type]);
  };

  const filteredAnomalies = useMemo(() => {
    if (!anomaliesData?.anomalies) return [];
    return anomaliesData.anomalies.filter(
      (a) => !dismissedAlerts.includes(a.type),
    );
  }, [anomaliesData, dismissedAlerts]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/60">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Analytics Dashboard
              </h1>
              <p className="mt-2 text-muted-foreground">
                Comprehensive insights into your code review performance
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={timePeriod === "7d" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimePeriod("7d")}
                >
                  7D
                </Button>
                <Button
                  variant={timePeriod === "30d" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimePeriod("30d")}
                >
                  30D
                </Button>
                <Button
                  variant={timePeriod === "90d" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimePeriod("90d")}
                >
                  90D
                </Button>
              </div>
              <DropdownSelect
                value={granularity}
                onValueChange={(v) =>
                  setGranularity(v as "daily" | "weekly" | "monthly")
                }
                placeholder="Granularity"
              >
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </DropdownSelect>
              <Button variant="outline" size="icon" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Anomaly Alerts */}
        {!anomaliesLoading && filteredAnomalies.length > 0 && (
          <div className="mb-8 space-y-3">
            {filteredAnomalies.map((anomaly, index) => (
              <AnomalyAlert
                key={index}
                severity={anomaly.severity}
                message={anomaly.message}
                onDismiss={() => dismissAlert(anomaly.type)}
              />
            ))}
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {overviewLoading ? (
            <>
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
            </>
          ) : (
            <>
              <MetricCard
                title="Total Reviews"
                value={overviewData?.totalReviews ?? 0}
                subtitle={TIME_PERIOD_LABELS[timePeriod]}
                icon={BarChart3}
                color={COLORS.primary}
                trend="up"
                trendValue="+12% from last period"
              />
              <MetricCard
                title="Completion Rate"
                value={`${overviewData?.completionRate ?? 0}%`}
                subtitle={`${overviewData?.completedReviews ?? 0} completed`}
                icon={CheckCircle2}
                color={COLORS.success}
                trend="up"
                trendValue="+5% improvement"
              />
              <MetricCard
                title="Avg. Completion Time"
                value={`${overviewData?.avgCompletionTimeHours ?? 0}h`}
                subtitle="Average time to complete"
                icon={Clock}
                color={COLORS.warning}
                trend="down"
                trendValue="-8% faster"
              />
              <MetricCard
                title="Avg. Risk Score"
                value={overviewData?.avgRiskScore ?? 0}
                subtitle="Out of 100"
                icon={AlertTriangle}
                color={
                  (overviewData?.avgRiskScore ?? 0) > 60
                    ? COLORS.danger
                    : (overviewData?.avgRiskScore ?? 0) > 30
                      ? COLORS.warning
                      : COLORS.success
                }
              />
            </>
          )}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Trend Chart */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Review Trends</h3>
                <p className="text-sm text-muted-foreground">
                  Volume over time
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS.primary }}
                  />
                  <span className="text-muted-foreground">Total</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS.success }}
                  />
                  <span className="text-muted-foreground">Completed</span>
                </div>
              </div>
            </div>
            {trendsLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <InteractiveLineChart
                data={trendsData ?? []}
                dataKey="total"
                color={COLORS.primary}
                height={300}
              />
            )}
          </Card>

          {/* Donut Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">Review Outcomes</h3>
            {ratesLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <AnimatedDonutChart
                data={[
                  {
                    label: "Approved",
                    value: ratesData?.approved.count ?? 0,
                    color: COLORS.success,
                  },
                  {
                    label: "Needs Changes",
                    value: ratesData?.needsChanges.count ?? 0,
                    color: COLORS.warning,
                  },
                  {
                    label: "Rejected",
                    value: ratesData?.rejected.count ?? 0,
                    color: COLORS.danger,
                  },
                  {
                    label: "Pending",
                    value: ratesData?.pending.count ?? 0,
                    color: COLORS.muted,
                  },
                ]}
                size={180}
              />
            )}
          </Card>
        </div>

        {/* Quality & Workload */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Quality Scores */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">Quality Metrics</h3>
            {qualityLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    label: "Coverage",
                    value: qualityData?.avgCoverage ?? 0,
                    color: COLORS.success,
                    icon: Bug,
                  },
                  {
                    label: "Maintainability",
                    value: qualityData?.avgMaintainability ?? 0,
                    color: COLORS.info,
                    icon: Code2,
                  },
                  {
                    label: "Performance",
                    value: qualityData?.avgPerformance ?? 0,
                    color: COLORS.warning,
                    icon: Zap,
                  },
                  {
                    label: "Security",
                    value: qualityData?.avgSecurity ?? 0,
                    color: "#8b5cf6",
                    icon: ShieldCheck,
                  },
                ].map((metric, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-muted/30 border border-border/30"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <metric.icon
                        className="h-4 w-4"
                        style={{ color: metric.color }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {metric.label}
                      </span>
                    </div>
                    <div
                      className="text-3xl font-bold"
                      style={{ color: metric.color }}
                    >
                      {metric.value}%
                    </div>
                    <div className="mt-2 h-2 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${metric.value}%`,
                          backgroundColor: metric.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Reviewer Workload */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">Team Workload</h3>
            {workloadLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <div className="space-y-4">
                {workloadData?.reviewers.slice(0, 5).map((reviewer, index) => (
                  <div key={reviewer.id} className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                      {reviewer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{reviewer.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {reviewer.total} reviews
                        </span>
                      </div>
                      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-1000"
                          style={{
                            width: `${Math.min((reviewer.total / (workloadData.reviewers[0]?.total || 1)) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {(!workloadData?.reviewers ||
                  workloadData.reviewers.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    No reviewer data available
                  </p>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Data Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Issues */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Top Issues Detected</h3>
            <div className="space-y-2">
              {issuesData?.topIssues && issuesData.topIssues.length > 0 ? (
                issuesData.topIssues.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30"
                  >
                    <span className="font-medium">{item.issue}</span>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No issues data available
                </p>
              )}
            </div>
          </Card>

          {/* Rejection Reasons */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Rejection Reasons</h3>
            <div className="space-y-2">
              {issuesData?.topRejectionReasons &&
              issuesData.topRejectionReasons.length > 0 ? (
                issuesData.topRejectionReasons.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30"
                  >
                    <span className="font-medium">{item.reason}</span>
                    <Badge variant="destructive">{item.count}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No rejection data available
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Quick Links */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                href: "/reviews",
                label: "View Reviews",
                icon: FileText,
                color: COLORS.primary,
              },
              {
                href: "/teams",
                label: "Manage Teams",
                icon: Users,
                color: COLORS.info,
              },
              {
                href: "/settings",
                label: "Settings",
                icon: Activity,
                color: COLORS.warning,
              },
              {
                href: "/repo",
                label: "Repositories",
                icon: Database,
                color: COLORS.success,
              },
            ].map((action, index) => (
              <Link key={index} href={action.href}>
                <div className="flex flex-col items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 hover:border-primary/50 transition-colors text-center">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${action.color}20` }}
                  >
                    <action.icon
                      className="h-6 w-6"
                      style={{ color: action.color }}
                    />
                  </div>
                  <span className="font-medium text-sm">{action.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
