"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { CumulativeData } from "@/lib/api";
import { formatTokens } from "@/lib/format";

export function CumulativeChart({ data }: { data: CumulativeData | null }) {
  if (!data?.data?.length) {
    return <div className="animate-pulse h-48 bg-muted rounded" />;
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data.data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="date"
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
            return date.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            });
          }}
          formatter={(value: number) => [formatTokens(value), "Cumulative"]}
        />
        <Area
          type="monotone"
          dataKey="cumulative"
          stroke="#39d353"
          fill="#39d353"
          fillOpacity={0.1}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
