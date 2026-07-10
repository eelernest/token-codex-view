"use client";

import { WifiOff, RefreshCw } from "lucide-react";

export function OfflineBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <WifiOff className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-xl font-semibold">OpenCode no está abierto</h2>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        El servidor local de OpenCode no está disponible. Asegúrate de que
        OpenCode Desktop esté ejecutándose.
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <RefreshCw className="h-4 w-4" />
        Reintentar
      </button>
    </div>
  );
}
