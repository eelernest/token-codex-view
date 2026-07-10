const BASE = "http://127.0.0.1:8765";

export async function apiGet<T>(path: string): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`${BASE}${path}`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export type DailyData = {
  data: { date: string; tokens: number; level: number }[];
  total: number;
  activeDays: number;
};

export type WeeklyData = {
  data: { weekStart: string; tokens: number; delta: number }[];
};

export type MonthlyData = {
  data: { month: string; tokens: number; cumulative: number }[];
};

export type CumulativeData = {
  data: { date: string; tokens: number; cumulative: number }[];
};

export type ActivityMetrics = {
  quickModeSessions: number;
  reasoningModel: { name: string; sessions: number } | null;
  distinctSkills: number;
  totalToolCalls: number;
  totalSessions: number;
  tools: { tool_name: string; cnt: number }[];
  mcpTools: { name: string; calls: number; operations: { name: string; calls: number }[] }[];
  skillCalls: number;
  skillNames: { name: string; count: number }[];
  agents: { agent: string; cnt: number }[];
};

export type StatsData = {
  totalTokens: number;
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
  mostUsedModel: { name: string; tokens: number };
  mostUsedModel30d: { name: string; tokens: number };
};

export type HealthData = {
  status: string;
  opencode: string;
  db: string;
};

export function fetchHealth() {
  return apiGet<HealthData>("/api/health");
}

export function fetchDaily(days = 365) {
  return apiGet<DailyData>(`/api/usage/daily?days=${days}`);
}

export function fetchWeekly(weeks = 12) {
  return apiGet<WeeklyData>(`/api/usage/weekly?weeks=${weeks}`);
}

export function fetchActivityMetrics() {
  return apiGet<ActivityMetrics>("/api/usage/activity-metrics");
}

export function fetchMonthly() {
  return apiGet<MonthlyData>("/api/usage/monthly");
}

export function fetchCumulative(days = 365) {
  return apiGet<CumulativeData>(`/api/usage/cumulative?days=${days}`);
}

export function fetchStats() {
  return apiGet<StatsData>("/api/usage/stats");
}
