"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { WeeklyData } from "@/lib/api";
import { formatTokens } from "@/lib/format";

export function WeeklyChart({ data }: { data: WeeklyData | null }) {
  if (!data?.data?.length) {
    return <div className="animate-pulse h-48 bg-muted rounded" />;
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data.data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="weekStart"
          tickFormatter={(d) => {
            const date = new Date(d + "T00:00:00");
            return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          }}
          className="text-xs fill-muted-foreground"
        />
        <YAxis className="text-xs fill-muted-foreground" tickFormatter={formatTokens} />
        <Tooltip
          contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
          labelFormatter={(d) => {
            const date = new Date(d + "T00:00:00");
            return `Week of ${date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;
          }}
          formatter={(value: number) => [formatTokens(value), "Tokens"]}
        />
        <Bar dataKey="tokens" fill="#39d353" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
