export type TimePeriod = "7d" | "30d" | "90d" | "6m" | "1y";

export const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "6m": "Last 6 months",
  "1y": "Last year",
};

export const COLORS = {
  primary: "#3b82f6",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#8b5cf6",
  dark: "#1e293b",
  muted: "#64748b",
};

export interface TrendDataPoint {
  date: string;
  total: number;
  completed: number;
  pending: number;
  failed: number;
}
