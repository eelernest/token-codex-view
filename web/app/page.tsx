"use client";

import { useState } from "react";
import { useHealth } from "@/hooks/use-health";
import { useUsage, ViewMode } from "@/hooks/use-usage";
import { OfflineBanner } from "@/components/offline-banner";
import { StatsHeader } from "@/components/stats-header";
import { ViewTabs } from "@/components/view-tabs";
import { ContributionGrid } from "@/components/contribution-grid";
import { WeeklyChart } from "@/components/weekly-chart";
import { CumulativeChart } from "@/components/cumulative-chart";

export default function Home() {
  const { online, loading: healthLoading, retry } = useHealth();
  const { daily, weekly, cumulative, stats, loading: usageLoading } = useUsage(online);
  const [view, setView] = useState<ViewMode>("daily");

  if (!online && !healthLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <OfflineBanner onRetry={retry} />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-start justify-center pt-12 md:pt-20">
      <div className="w-full max-w-4xl px-4">
        <div className="mb-2">
          <span className="text-xs text-muted-foreground uppercase tracking-widest">Token Usage</span>
        </div>

        <StatsHeader stats={stats} />
        <ViewTabs active={view} onChange={setView} />

        {view === "daily" && <ContributionGrid data={daily} />}
        {view === "weekly" && <WeeklyChart data={weekly} />}
        {view === "cumulative" && <CumulativeChart data={cumulative} />}
      </div>
    </main>
  );
}
