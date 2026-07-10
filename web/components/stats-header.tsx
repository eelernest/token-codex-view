"use client";

import { formatTokens } from "@/lib/format";
import type { StatsData } from "@/lib/api";
import { Flame, Trophy, Zap } from "lucide-react";

export function StatsHeader({ stats }: { stats: StatsData | null }) {
  if (!stats) {
    return (
      <div className="animate-pulse space-y-2 mb-6">
        <div className="h-6 bg-muted rounded w-64" />
        <div className="h-4 bg-muted rounded w-48" />
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-2xl font-bold">{formatTokens(stats.totalTokens)} tokens</span>
        <span className="text-sm text-muted-foreground">&middot;</span>
        <span className="text-sm">{stats.activeDays} días activos</span>
        <span className="text-sm text-muted-foreground">&middot;</span>
        <span className="inline-flex items-center gap-1 text-sm">
          <Flame className="h-4 w-4 text-orange-500" />
          {stats.currentStreak} racha
        </span>
        <span className="text-sm text-muted-foreground">&middot;</span>
        <span className="inline-flex items-center gap-1 text-sm">
          <Trophy className="h-4 w-4 text-yellow-500" />
          {stats.longestStreak}
        </span>
      </div>
      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Zap className="h-3 w-3" />
          {stats.mostUsedModel.name}
        </span>
        <span>&middot;</span>
        <span>Último mes: {stats.mostUsedModel30d.name}</span>
      </div>
    </div>
  );
}
