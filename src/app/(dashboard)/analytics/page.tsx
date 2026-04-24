"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { TimePeriod } from "@/features/analytics/types";
import { AnalyticsHeader } from "@/features/analytics/components/AnalyticsHeader";
import { AnomalyAlert } from "@/features/analytics/components/AnomalyAlert";
import { KeyMetricsGrid } from "@/features/analytics/components/KeyMetricsGrid";
import { ChartsRow } from "@/features/analytics/components/ChartsRow";
import { QualityWorkloadRow } from "@/features/analytics/components/QualityWorkloadRow";
import { IssuesTablesRow } from "@/features/analytics/components/IssuesTablesRow";
import { QuickActionsCard } from "@/features/analytics/components/QuickActionsCard";
import { FeedbackTrendRow } from "@/features/analytics/components/FeedbackTrendRow";

export default function AnalyticsPage() {
  const router = useRouter();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("30d");
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
  const { data: issuesData } = trpc.analytics.getTopIssues.useQuery({
    timePeriod,
    limit: 10,
  });
  const { data: anomaliesData, isLoading: anomaliesLoading } =
    trpc.analytics.getAnomalies.useQuery({ timePeriod });
  const { data: feedbackStats, isLoading: feedbackLoading } =
    trpc.review.getFeedbackStats.useQuery({});

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
      <AnalyticsHeader
        timePeriod={timePeriod}
        setTimePeriod={setTimePeriod}
        granularity={granularity}
        setGranularity={setGranularity}
        onRefresh={handleRefresh}
        onExport={handleExport}
      />

      <div className="container mx-auto px-4 py-8">
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

        <KeyMetricsGrid
          overviewData={overviewData}
          overviewLoading={overviewLoading}
          timePeriod={timePeriod}
        />

        <ChartsRow
          trendsData={trendsData}
          trendsLoading={trendsLoading}
          ratesData={ratesData}
          ratesLoading={ratesLoading}
        />

        <QualityWorkloadRow
          qualityData={qualityData}
          qualityLoading={qualityLoading}
          workloadData={workloadData}
          workloadLoading={workloadLoading}
        />

        <FeedbackTrendRow
          data={feedbackStats}
          isLoading={feedbackLoading}
        />

        <IssuesTablesRow issuesData={issuesData} />

        <QuickActionsCard />
      </div>
    </div>
  );
}
