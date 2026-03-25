"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { TimePeriod } from "@/components/analytics/analytics.types";
import { AnalyticsHeader } from "@/components/analytics/AnalyticsHeader";
import { AnomalyAlert } from "@/components/analytics/AnomalyAlert";
import { KeyMetricsGrid } from "@/components/analytics/KeyMetricsGrid";
import { ChartsRow } from "@/components/analytics/ChartsRow";
import { QualityWorkloadRow } from "@/components/analytics/QualityWorkloadRow";
import { IssuesTablesRow } from "@/components/analytics/IssuesTablesRow";
import { QuickActionsCard } from "@/components/analytics/QuickActionsCard";

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

        <IssuesTablesRow issuesData={issuesData} />

        <QuickActionsCard />
      </div>
    </div>
  );
}
