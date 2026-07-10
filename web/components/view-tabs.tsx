"use client";

import type { ViewMode } from "@/hooks/use-usage";

const tabs: { mode: ViewMode; label: string }[] = [
  { mode: "daily", label: "Diario" },
  { mode: "weekly", label: "Semanal" },
  { mode: "cumulative", label: "Acumulado" },
];

export function ViewTabs({
  active,
  onChange,
}: {
  active: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div className="flex gap-6 mb-6">
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
  );
}
