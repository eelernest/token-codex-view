"use client";

import { formatTokens } from "@/lib/format";
import type { StatsData } from "@/lib/api";

export function StatsHeader({ stats }: { stats: StatsData | null }) {
  if (!stats) {
    return (
      <div className="animate-pulse space-y-4 mb-8">
        <div className="flex gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 w-32 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-baseline gap-2 mb-6">
        <span className="text-3xl font-bold">{formatTokens(stats.totalTokens)}</span>
        <span className="text-sm text-muted-foreground">tokens acumulados</span>
      </div>
      <div className="flex flex-wrap gap-6">
        <StatCard label="Racha actual" value={`${stats.currentStreak} días`} />
        <StatCard label="Racha más larga" value={`${stats.longestStreak} días`} />
        <StatCard label="Días activos" value={`${stats.activeDays} días`} />
        <StatCard label="Modelo principal" value={stats.mostUsedModel.name} small />
      </div>
    </div>
  );
}

function StatCard({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className={`${small ? "text-sm" : "text-base"} font-semibold truncate`}>{value}</span>
    </div>
  );
}
