"use client";

import type { ViewMode } from "@/hooks/use-usage";
import { CalendarDays, BarChart3, TrendingUp } from "lucide-react";

const tabs: { mode: ViewMode; label: string; icon: typeof CalendarDays }[] = [
  { mode: "daily", label: "Daily", icon: CalendarDays },
  { mode: "weekly", label: "Weekly", icon: BarChart3 },
  { mode: "cumulative", label: "Cumulative", icon: TrendingUp },
];

export function ViewTabs({
  active,
  onChange,
}: {
  active: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div className="flex gap-1 mb-6 border-b border-border">
      {tabs.map(({ mode, label, icon: Icon }) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            active === mode
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
