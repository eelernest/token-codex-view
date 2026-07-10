"use client";

import type { ViewMode } from "@/hooks/use-usage";

const tabs: { mode: ViewMode; label: string }[] = [
  { mode: "daily", label: "Diario" },
  { mode: "weekly", label: "Semanal" },
  { mode: "monthly", label: "Mensual" },
  { mode: "cumulative", label: "Acumulado" },
];

export function ViewTabs({
  active,
  onChange,
  years,
  selectedYear,
  onYearChange,
}: {
  active: ViewMode;
  onChange: (mode: ViewMode) => void;
  years?: string[];
  selectedYear?: string;
  onYearChange?: (year: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <div className="flex gap-6">
        {tabs.map(({ mode, label }) => (
          <button
            key={mode}
            onClick={() => onChange(mode)}
            className={`text-sm transition-colors ${
              active === mode
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {active === "daily" && years && years.length > 0 && (
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={() => onYearChange?.("all")}
            className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
              selectedYear === "all"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          {years.map((year) => (
            <button
              key={year}
              onClick={() => onYearChange?.(year)}
              className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                selectedYear === year
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
