"use client";

import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDateTime } from "@/utils/formatters";

export function SensorsPageHeader() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-700/40 pb-2">
      <div className="min-w-0">
        <h1 className="text-sm font-semibold text-white">Sensores</h1>
        <p className="text-[10px] text-slate-500">Monitoreo detallado de sensores del sistema de riego</p>
      </div>
      <div className="flex min-w-0 items-center gap-2 text-[10px] text-slate-400">
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#22c55e]" />
          </span>
          <CheckCircle2 className="size-3" strokeWidth={1.35} />
          En línea
        </span>
        <span className="truncate text-slate-500">{now ? formatDateTime(now) : "—"}</span>
      </div>
    </header>
  );
}
