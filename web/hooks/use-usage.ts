"use client";

import { useEffect, useState } from "react";
import {
  fetchDaily,
  fetchWeekly,
  fetchCumulative,
  fetchStats,
  DailyData,
  WeeklyData,
  CumulativeData,
  StatsData,
} from "@/lib/api";

export type ViewMode = "daily" | "weekly" | "cumulative";

export function useUsage(online: boolean) {
  const [daily, setDaily] = useState<DailyData | null>(null);
  const [weekly, setWeekly] = useState<WeeklyData | null>(null);
  const [cumulative, setCumulative] = useState<CumulativeData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!online) return;
    setLoading(true);
    Promise.all([fetchDaily(), fetchWeekly(), fetchCumulative(), fetchStats()]).then(
      ([d, w, c, s]) => {
        setDaily(d);
        setWeekly(w);
        setCumulative(c);
        setStats(s);
        setLoading(false);
      }
    );
  }, [online]);

  return { daily, weekly, cumulative, stats, loading };
}
