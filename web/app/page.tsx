"use client";

import { useState, useMemo } from "react";
import { useHealth } from "@/hooks/use-health";
import { useUsage, ViewMode } from "@/hooks/use-usage";
import { OfflineBanner } from "@/components/offline-banner";
import { StatsHeader } from "@/components/stats-header";
import { ViewTabs } from "@/components/view-tabs";
import { ContributionGrid } from "@/components/contribution-grid";
import { ActivityMetricsCard } from "@/components/activity-metrics";
import { WeeklyChart } from "@/components/weekly-chart";
import { MonthlyChart } from "@/components/monthly-chart";
import { CumulativeChart } from "@/components/cumulative-chart";

export default function Home() {
  const { online, loading: healthLoading, retry } = useHealth();
  const { daily, weekly, monthly, cumulative, stats, activity, loading: usageLoading } = useUsage(online);
  const [view, setView] = useState<ViewMode>("daily");
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  const years = useMemo(() => {
    if (!daily?.data?.length) return [];
    const yearSet = new Set(daily.data.map((d) => d.date.slice(0, 4)));
    return Array.from(yearSet).sort();
  }, [daily]);

  const filteredDaily = useMemo(() => {
    if (!daily || selectedYear === "all") return daily;

    const yearData = daily.data.filter((d) => d.date.startsWith(selectedYear));
    const dataMap = new Map(yearData.map((d) => [d.date, d]));

    const fullYear: { date: string; tokens: number; level: number }[] = [];
    const year = parseInt(selectedYear);
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      fullYear.push(dataMap.get(dateStr) ?? { date: dateStr, tokens: 0, level: 0 });
    }

    return { ...daily, data: fullYear };
  }, [daily, selectedYear]);

  if (!online && !healthLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <OfflineBanner onRetry={retry} />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-4xl px-3 sm:px-4">
        <div className="mb-2">
          <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest">Token Usage</span>
        </div>

        <StatsHeader stats={stats} />
        <ViewTabs active={view} onChange={setView} years={years} selectedYear={selectedYear} onYearChange={setSelectedYear} />

        {view === "daily" && (
          <>
            <ContributionGrid data={filteredDaily} compact={selectedYear !== "all"} />
            <ActivityMetricsCard data={activity} />
          </>
        )}
        {view === "weekly" && <WeeklyChart data={weekly} />}
        {view === "monthly" && <MonthlyChart data={monthly} />}
        {view === "cumulative" && <CumulativeChart data={cumulative} />}
      </div>
    </main>
  );
}
