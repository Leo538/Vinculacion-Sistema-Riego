"use client";

import dynamic from "next/dynamic";
import { SensorsPageHeader } from "@/modules/sensores/components/SensorsPageHeader";
import { sensorsData } from "@/modules/sensores/data/sensorsData";
import { AppShell } from "@/shared/components/layout/AppShell";
import { Card } from "@/shared/components/ui/Card";

const SensorGaugeCard = dynamic(() => import("@/modules/sensores/components/SensorGaugeCard").then((m) => m.SensorGaugeCard), {
  loading: () => (
    <Card className="h-[220px] animate-pulse !p-6">
      <div className="h-full w-full rounded-lg bg-slate-800/30" />
    </Card>
  ),
  ssr: false
});
const SensorHistoryChart = dynamic(() => import("@/modules/sensores/components/SensorHistoryChart").then((m) => m.SensorHistoryChart), {
  loading: () => (
    <Card className="h-[11rem] animate-pulse">
      <div className="h-full w-full rounded-lg bg-slate-800/30" />
    </Card>
  ),
  ssr: false
});
const SensorBarIndicator = dynamic(() => import("@/modules/sensores/components/SensorBarIndicator").then((m) => m.SensorBarIndicator), {
  loading: () => (
    <Card className="h-[7.25rem] animate-pulse">
      <div className="h-full w-full rounded-lg bg-slate-800/30" />
    </Card>
  ),
  ssr: false
});
const SensorTechnicalSummary = dynamic(
  () => import("@/modules/sensores/components/SensorTechnicalSummary").then((m) => m.SensorTechnicalSummary),
  {
    loading: () => (
      <Card className="h-[10rem] animate-pulse">
        <div className="h-full w-full rounded-lg bg-slate-800/30" />
      </Card>
    ),
    ssr: false
  }
);
const SensorStatusCompact = dynamic(() => import("@/modules/sensores/components/SensorStatusCompact").then((m) => m.SensorStatusCompact), {
  loading: () => (
    <Card className="h-[10rem] animate-pulse">
      <div className="h-full w-full rounded-lg bg-slate-800/30" />
    </Card>
  ),
  ssr: false
});

export function SensoresPageView() {
  return (
    <AppShell mainClassName="min-h-screen overflow-y-auto overflow-x-hidden">
      <SensorsPageHeader />

      <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {sensorsData.primaryGauges.map((sensor) => (
          <SensorGaugeCard key={sensor.id} sensor={sensor} />
        ))}
      </div>

      <div className="grid shrink-0 grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
        {sensorsData.barIndicators.map((item) => (
          <SensorBarIndicator key={item.id} item={item} />
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2.5 xl:grid-cols-12">
        <div className="grid min-h-0 grid-cols-1 gap-2.5 md:grid-cols-2 xl:col-span-8">
          {sensorsData.historySeries.map((series) => (
            <SensorHistoryChart key={series.id} series={series} />
          ))}
        </div>

        <div className="grid min-h-0 grid-cols-1 gap-2.5 md:grid-cols-2 xl:col-span-4 xl:grid-cols-1">
          <SensorTechnicalSummary stats={sensorsData.technical} />
          <SensorStatusCompact sensors={sensorsData.compactStatus} />
        </div>
      </div>
    </AppShell>
  );
}
