"use client";

import { useMemo } from "react";
import type { DailyData } from "@/lib/api";
import { formatTokens, formatDate } from "@/lib/format";
import { useTheme } from "@/app/providers";

const CELL_SIZE = 13;
const CELL_GAP = 3;
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const LIGHT_COLORS = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];
const DARK_COLORS = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];

function getLevelColor(level: number, isDark: boolean) {
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
  return colors[Math.min(level, 4)];
}

export function ContributionGrid({ data, compact }: { data: DailyData | null; compact?: boolean }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { weeks, months } = useMemo(() => {
    if (!data?.data?.length) return { weeks: [], months: [] };

    const days = data.data;
    const weeks: { date: string; level: number; tokens: number }[][] = [];
    const monthLabels: { index: number; label: string }[] = [];

    let week: { date: string; level: number; tokens: number }[] = [];
    const firstDate = new Date(days[0].date + "T00:00:00");
    const startDay = firstDate.getDay();
    for (let i = 0; i < startDay; i++) {
      week.push({ date: "", level: 0, tokens: 0 });
    }

    let lastMonth = "";
    for (let i = 0; i < days.length; i++) {
      const d = days[i];
      week.push({ date: d.date, level: d.level, tokens: d.tokens });
      const month = d.date.slice(0, 7);
      if (month !== lastMonth) {
        monthLabels.push({ index: weeks.length + (week.length - 1) / 7, label: d.date.slice(5, 7) });
        lastMonth = month;
      }
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push({ date: "", level: 0, tokens: 0 });
      weeks.push(week);
    }

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const months = monthLabels.map((m) => ({
      x: m.index * (CELL_SIZE + CELL_GAP),
      label: monthNames[parseInt(m.label) - 1] || m.label,
    }));

    return { weeks, months };
  }, [data]);

  if (!data?.data?.length) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-[130px] bg-muted rounded" />
      </div>
    );
  }

  const totalWeeks = weeks.length;
  const svgWidth = totalWeeks * (CELL_SIZE + CELL_GAP) + 40;
  const svgHeight = 7 * (CELL_SIZE + CELL_GAP) + 30;

  return (
    <div className="w-full">
      <div className={compact ? "" : "overflow-x-auto pb-4"}>
        <div className={compact ? "w-full" : "inline-block"}>
          <svg
            width={compact ? undefined : svgWidth}
            height={compact ? undefined : svgHeight + 20}
            viewBox={compact ? `0 0 ${svgWidth} ${svgHeight + 20}` : undefined}
            className={compact ? "w-full text-xs" : "text-xs"}
            style={compact ? { height: "auto", maxWidth: svgWidth } : undefined}
          >
            {months.map((m, i) => (
              <text key={i} x={m.x + 40} y={12} fill="currentColor" className="fill-muted-foreground">
                {m.label}
              </text>
            ))}

            {DAY_LABELS.map((label, i) =>
              label ? (
                <text
                  key={i}
                  x={0}
                  y={i * (CELL_SIZE + CELL_GAP) + 30 + CELL_SIZE - 2}
                  fill="currentColor"
                  className="fill-muted-foreground"
                >
                  {label}
                </text>
              ) : null
            )}

            {weeks.map((week, wi) =>
              week.map((day, di) =>
                day.date ? (
                  <rect
                    key={`${wi}-${di}`}
                    x={wi * (CELL_SIZE + CELL_GAP) + 40}
                    y={di * (CELL_SIZE + CELL_GAP) + 20}
                    width={CELL_SIZE}
                    height={CELL_SIZE}
                    rx={2}
                    fill={getLevelColor(day.level, isDark)}
                    className="grid-cell"
                  >
                    <title>{`${formatDate(day.date)} · ${formatTokens(day.tokens)} tokens`}</title>
                  </rect>
                ) : null
              )
            )}
          </svg>
        </div>
      </div>
      <div className="flex items-center gap-1 justify-end text-xs text-muted-foreground px-1 pb-2">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <span
            key={level}
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: getLevelColor(level, isDark) }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
