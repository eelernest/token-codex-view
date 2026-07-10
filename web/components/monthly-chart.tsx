"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { MonthlyData } from "@/lib/api";
import { formatTokens } from "@/lib/format";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function MonthlyChart({ data }: { data: MonthlyData | null }) {
  if (!data?.data?.length) {
    return <div className="animate-pulse h-48 bg-muted rounded" />;
  }

  const chartData = data.data.map((d) => {
    const [year, month] = d.month.split("-");
    return {
      ...d,
      label: `${MONTH_LABELS[parseInt(month) - 1]} ${year}`,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="label" className="text-xs fill-muted-foreground" />
        <YAxis className="text-xs fill-muted-foreground" tickFormatter={formatTokens} />
        <Tooltip
          contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
          formatter={(value: number) => [formatTokens(value), "Tokens"]}
        />
        <Bar dataKey="tokens" fill="#39d353" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
