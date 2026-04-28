"use client";

import { SensorChart } from "@/modules/sensores/components/SensorChart";
import { SensorStatusList } from "@/modules/sensores/components/SensorStatusList";
import { SensorSummaryCard } from "@/modules/sensores/components/SensorSummaryCard";
import { SensorTechnicalStatus } from "@/modules/sensores/components/SensorTechnicalStatus";
import { SensorsPageHeader } from "@/modules/sensores/components/SensorsPageHeader";
import { mockSensorsData } from "@/modules/sensores/data/mockSensorsData";
import { AppShell } from "@/shared/components/layout/AppShell";

export function SensoresPageView() {
  return (
    <AppShell mainClassName="overflow-y-auto overflow-x-hidden">
      <SensorsPageHeader />

      <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4">
        {mockSensorsData.summaryItems.map((item) => (
          <SensorSummaryCard key={item.id} item={item} />
        ))}
      </div>

      <div className="grid min-h-0 shrink-0 grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="min-h-0 lg:col-span-2">
          <SensorStatusList rows={mockSensorsData.sensorRows} />
        </div>
        <div className="min-h-0">
          <SensorTechnicalStatus stats={mockSensorsData.technical} />
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SensorChart
          title="Humedad del suelo (24h)"
          subtitle="Últimas 24 h · panel de sensores"
          data={mockSensorsData.soilHumidity24h}
          valueLabel="Humedad"
          unit="%"
        />
        <SensorChart
          title="Temperatura (24h)"
          subtitle="Últimas 24 h · ambiente"
          data={mockSensorsData.temperature24h}
          valueLabel="Temperatura"
          unit="°C"
          color="#34d399"
        />
        <SensorChart
          title="Nivel del tanque (24h)"
          subtitle="Últimas 24 h · capacidad"
          data={mockSensorsData.tankLevel24h}
          valueLabel="Nivel"
          unit="%"
          color="#a78bfa"
        />
      </div>
    </AppShell>
  );
}
