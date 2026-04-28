"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { IrrigationRecommendation } from "@/modules/dashboard/components/IrrigationRecommendation";
import type { DashboardData } from "@/modules/dashboard/types";
import { getOpenMeteoDashboardData, mockDashboardData } from "@/modules/riego/data/dashboardTelemetry";
import { AppShell } from "@/shared/components/layout/AppShell";
import { Card } from "@/shared/components/ui/Card";
import { formatDateTime } from "@/shared/utils/formatters";

export function RiegoPageView() {
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
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#CBDDF5] pb-2 dark:border-slate-700/40">
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-slate-900 dark:text-white">Riego</h1>
          <p className="text-[10px] text-slate-500">Recomendaciones y programación del sistema de riego</p>
        </div>
        <div className="flex min-w-0 items-center gap-2 text-[10px] text-slate-400">
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-400">
            <CheckCircle2 className="size-3" strokeWidth={1.35} />
            En línea
          </span>
          <span className="truncate text-slate-500">{now ? formatDateTime(now) : "—"}</span>
        </div>
      </header>

      <div className="grid max-w-3xl shrink-0 gap-3">
        <IrrigationRecommendation irrigation={dashboardData.irrigation} />
        <Card padding="sm" className="text-[11px] text-slate-400">
          <p className="font-medium text-slate-800 dark:text-slate-200">Nota</p>
          <p className="mt-1 leading-relaxed">
            Vista dedicada a riego. Los datos siguen siendo de demostración / Open-Meteo hasta conectar el backend.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
