import { SensorsPageHeader } from "@/modules/sensores/components/SensorsPageHeader";
import { SensorBarIndicator } from "@/modules/sensores/components/SensorBarIndicator";
import { SensorGaugeCard } from "@/modules/sensores/components/SensorGaugeCard";
import { SensorHistoryChartLazy } from "@/modules/sensores/components/SensorHistoryChartLazy";
import { SensorStatusCompact } from "@/modules/sensores/components/SensorStatusCompact";
import { SensorTechnicalSummary } from "@/modules/sensores/components/SensorTechnicalSummary";
import { sensorsData } from "@/modules/sensores/data/sensorsData";
import { AppShell } from "@/shared/components/layout/AppShell";

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
          {sensorsData.historySeries.map((series, idx) => (
            <SensorHistoryChartLazy key={series.id} series={series} mountDelayMs={idx * 120} />
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
