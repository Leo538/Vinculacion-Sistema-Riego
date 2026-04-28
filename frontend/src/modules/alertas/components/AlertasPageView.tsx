"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { AlertPanel } from "@/modules/dashboard/components/AlertPanel";
import type { DashboardData } from "@/modules/dashboard/types";
import { getOpenMeteoDashboardData, mockDashboardData } from "@/modules/alertas/data/dashboardTelemetry";
import { AppShell } from "@/shared/components/layout/AppShell";
import { Card } from "@/shared/components/ui/Card";
import { formatDateTime } from "@/shared/utils/formatters";

export function AlertasPageView() {
  const [dashboardData, setDashboardData] = useState<DashboardData>(mockDashboardData);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    let mounted = true;
    getOpenMeteoDashboardData().then((data) => {
      if (mounted) {
        setDashboardData(data);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <AppShell mainClassName="overflow-y-auto overflow-x-hidden">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-700/40 pb-2">
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-white">Alertas</h1>
          <p className="text-[10px] text-slate-500">Historial y avisos del sistema de monitoreo</p>
        </div>
        <div className="flex min-w-0 items-center gap-2 text-[10px] text-slate-400">
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-400">
            <CheckCircle2 className="size-3" strokeWidth={1.35} />
            En línea
          </span>
          <span className="truncate text-slate-500">{now ? formatDateTime(now) : "—"}</span>
        </div>
      </header>

      <div className="grid min-h-0 max-w-3xl shrink-0 gap-3">
        <AlertPanel alerts={dashboardData.alerts} />
        <Card padding="sm" className="text-[11px] text-slate-400">
          <p className="font-medium text-slate-200">Nota</p>
          <p className="mt-1 leading-relaxed">
            Las alertas se cargan con los mismos datos que el dashboard (mock / Open-Meteo) hasta integrar API real.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
