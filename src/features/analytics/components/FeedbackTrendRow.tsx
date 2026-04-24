"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { COLORS } from "../types";

const feedbackChartConfig: ChartConfig = {
  up: { label: "Helpful", color: COLORS.success },
  down: { label: "Not Helpful", color: COLORS.danger },
};

interface FeedbackTrendRowProps {
  data: { date: string; up: number; down: number }[] | undefined;
  isLoading: boolean;
}

export function FeedbackTrendRow({ data, isLoading }: FeedbackTrendRowProps) {
  return (
    <div className="grid grid-cols-1 gap-6 mb-8">
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Review Quality Feedback</h3>
          <p className="text-sm text-muted-foreground">
            Author sentiment over time
          </p>
        </div>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <ChartContainer
            config={feedbackChartConfig}
            className="h-[300px] w-full"
          >
            <BarChart
              data={data ?? []}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border/30"
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="up"
                fill={COLORS.success}
                radius={[4, 4, 0, 0]}
                stackId="feedback"
                name="Helpful"
              />
              <Bar
                dataKey="down"
                fill={COLORS.danger}
                radius={[4, 4, 0, 0]}
                stackId="feedback"
                name="Not Helpful"
              />
            </BarChart>
          </ChartContainer>
        )}
      </Card>
    </div>
  );
}
