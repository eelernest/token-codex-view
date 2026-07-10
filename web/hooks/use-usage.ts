"use client";

import { useEffect, useState, useRef } from "react";
import {
  fetchDaily,
  fetchWeekly,
  fetchMonthly,
  fetchCumulative,
  fetchStats,
  fetchActivityMetrics,
  DailyData,
  WeeklyData,
  MonthlyData,
  CumulativeData,
  StatsData,
  ActivityMetrics,
} from "@/lib/api";

export type ViewMode = "daily" | "weekly" | "monthly" | "cumulative";

const RETRY_INTERVAL = 5000;
const MAX_RETRIES = 5;

export function useUsage(online: boolean) {
  const [daily, setDaily] = useState<DailyData | null>(null);
  const [weekly, setWeekly] = useState<WeeklyData | null>(null);
  const [monthly, setMonthly] = useState<MonthlyData | null>(null);
  const [cumulative, setCumulative] = useState<CumulativeData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [activity, setActivity] = useState<ActivityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const retryRef = useRef(0);

  useEffect(() => {
    if (!online) return;
    retryRef.current = 0;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const [d, w, m, c, s, a] = await Promise.all([
        fetchDaily(), fetchWeekly(), fetchMonthly(),
        fetchCumulative(), fetchStats(), fetchActivityMetrics(),
      ]);
      if (cancelled) return;
      setDaily(d);
      setWeekly(w);
      setMonthly(m);
      setCumulative(c);
      setStats(s);
      setActivity(a);
      setLoading(false);

      if (!s && retryRef.current < MAX_RETRIES) {
        retryRef.current++;
        setTimeout(load, RETRY_INTERVAL);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [online]);

  return { daily, weekly, monthly, cumulative, stats, activity, loading };
}
