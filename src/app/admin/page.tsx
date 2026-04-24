"use client";

import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  GitPullRequest,
  Database,
  Users2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  loading,
}: {
  title: string;
  value?: number | string;
  icon: React.ElementType;
  description?: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

const chartConfig = {
  users: { label: "New users", color: "hsl(var(--chart-1))" },
  reviews: { label: "Reviews", color: "hsl(var(--chart-2))" },
};

export default function AdminOverviewPage() {
  const { data: stats, isLoading: statsLoading } =
    trpc.admin.getStats.useQuery();
  const { data: growth, isLoading: growthLoading } =
    trpc.admin.getGrowthData.useQuery();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">Platform-wide statistics</p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers}
          icon={Users}
          description={`+${stats?.recentSignups ?? 0} this week`}
          loading={statsLoading}
        />
        <StatCard
          title="Total Reviews"
          value={stats?.totalReviews}
          icon={GitPullRequest}
          description={`+${stats?.reviewsLast7Days ?? 0} last 7 days`}
          loading={statsLoading}
        />
        <StatCard
          title="Repositories"
          value={stats?.totalRepositories}
          icon={Database}
          loading={statsLoading}
        />
        <StatCard
          title="Teams"
          value={stats?.totalTeams}
          icon={Users2}
          loading={statsLoading}
        />
      </div>

      {/* Review status breakdown */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Completed",
              count: stats.reviewsByStatus.COMPLETED,
              icon: CheckCircle2,
              color: "text-green-500",
            },
            {
              label: "Pending",
              count: stats.reviewsByStatus.PENDING,
              icon: Clock,
              color: "text-yellow-500",
            },
            {
              label: "Processing",
              count: stats.reviewsByStatus.PROCESSING,
              icon: TrendingUp,
              color: "text-blue-500",
            },
            {
              label: "Failed",
              count: stats.reviewsByStatus.FAILED,
              icon: AlertCircle,
              color: "text-red-500",
            },
          ].map(({ label, count, icon: Icon, color }) => (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                <Icon className={`h-4 w-4 ${color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Growth chart */}
      <Card>
        <CardHeader>
          <CardTitle>30-day Growth</CardTitle>
          <CardDescription>New users and reviews per day</CardDescription>
        </CardHeader>
        <CardContent>
          {growthLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growth}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: string) => v.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="var(--color-users)"
                    fill="var(--color-users)"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="reviews"
                    stroke="var(--color-reviews)"
                    fill="var(--color-reviews)"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
