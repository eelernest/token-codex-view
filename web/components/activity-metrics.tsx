"use client";

import type { ActivityMetrics } from "@/lib/api";

export function ActivityMetricsCard({ data }: { data: ActivityMetrics | null }) {
  if (!data) {
    return <div className="animate-pulse h-32 bg-muted rounded-lg mt-8" />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10">
      <div>
        <h3 className="text-sm font-semibold mb-3 text-foreground">Datos de actividad</h3>
        <div className="space-y-2">
          <Row label="Modo rápido" value={`${data.quickModeSessions} sesiones`} />
          <Row
            label="Razonamiento más usado"
            value={data.reasoningModel ? `${data.reasoningModel.name} (${data.reasoningModel.sessions} sesiones)` : "N/A"}
          />
          <Row label="Habilidades exploradas" value={`${data.distinctSkills}`} />
          <Row label="Total de usos" value={`${data.totalToolCalls}`} />
          <Row label="Tareas totales" value={`${data.totalSessions}`} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3 text-foreground">Complementos más usados</h3>
        <div className="space-y-2">
          {data.mcpTools.length > 0 && (
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">MCP</span>
              {data.mcpTools.map((mcp) => (
                <div key={mcp.name} className="text-sm font-medium ml-2">
                  {mcp.name}: {mcp.calls} llamadas
                </div>
              ))}
            </div>
          )}
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Skill</span>
            {data.skillNames.length > 0 ? data.skillNames.map((s) => (
              <div key={s.name} className="flex justify-between text-sm ml-2">
                <span>{s.name}</span>
                <span className="text-muted-foreground">{s.count} llamadas</span>
              </div>
            )) : (
              <div className="text-sm text-muted-foreground ml-2">{data.skillCalls} llamadas</div>
            )}
          </div>
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Agentes</span>
            {data.agents.map((a) => (
              <div key={a.agent} className="flex justify-between text-sm ml-2">
                <span className="capitalize">{a.agent}</span>
                <span className="text-muted-foreground">{a.cnt} sesiones</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
