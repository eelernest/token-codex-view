"use client";

import { formatTokens } from "@/lib/format";
import type { StatsData } from "@/lib/api";

export function StatsHeader({ stats, todayTokens, dailyLimit }: { stats: StatsData | null; todayTokens?: number; dailyLimit?: number }) {
  if (!stats) {
    return (
      <div className="animate-pulse space-y-4 mb-8">
        <div className="flex gap-4 sm:gap-6 flex-wrap">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 w-24 sm:w-32 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const pct = dailyLimit && todayTokens ? Math.min(100, (todayTokens / dailyLimit) * 100) : 0;

  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex items-center justify-between gap-4 mb-4 sm:mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold">{formatTokens(stats.totalTokens)}</span>
          <span className="text-xs sm:text-sm text-muted-foreground">tokens acumulados</span>
        </div>
        {dailyLimit && (
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Hoy</span>
            <div className="flex items-center gap-2">
              <div className="w-16 sm:w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#39d353",
                  }}
                />
              </div>
              <span className="text-xs font-semibold whitespace-nowrap">
                {formatTokens(todayTokens || 0)}
                <span className="text-muted-foreground font-normal"> / {formatTokens(dailyLimit)}</span>
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-4 sm:gap-6">
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
      <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className={`${small ? "text-xs sm:text-sm" : "text-sm sm:text-base"} font-semibold truncate`}>{value}</span>
    </div>
  );
}
