"use client";

import { useEffect, useState } from "react";
import {
  fetchDaily,
  fetchWeekly,
  fetchMonthly,
  fetchCumulative,
  fetchStats,
  DailyData,
  WeeklyData,
  MonthlyData,
  CumulativeData,
  StatsData,
} from "@/lib/api";

export type ViewMode = "daily" | "weekly" | "monthly" | "cumulative";

export function useUsage(online: boolean) {
  const [daily, setDaily] = useState<DailyData | null>(null);
  const [weekly, setWeekly] = useState<WeeklyData | null>(null);
  const [monthly, setMonthly] = useState<MonthlyData | null>(null);
  const [cumulative, setCumulative] = useState<CumulativeData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!online) return;
    setLoading(true);
    Promise.all([fetchDaily(), fetchWeekly(), fetchMonthly(), fetchCumulative(), fetchStats()]).then(
      ([d, w, m, c, s]) => {
        setDaily(d);
        setWeekly(w);
        setMonthly(m);
        setCumulative(c);
        setStats(s);
        setLoading(false);
      }
    );
  }, [online]);

  return { daily, weekly, monthly, cumulative, stats, loading };
}
