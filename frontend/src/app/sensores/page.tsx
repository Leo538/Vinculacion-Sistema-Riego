"use client";

import { useEffect, useState } from "react";
import { SensorChart } from "@/components/sensors/SensorChart";
import { SensorStatusList } from "@/components/sensors/SensorStatusList";
import { SensorSummaryCard } from "@/components/sensors/SensorSummaryCard";
import { SensorTechnicalStatus } from "@/components/sensors/SensorTechnicalStatus";
import { SensorsPageHeader } from "@/components/sensors/SensorsPageHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { mockSensorsData } from "@/data/mockSensorsData";

export default function SensoresPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("dashboard-theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("dashboard-theme", theme);
  }, [theme]);

  return (
    <div className="dashboard-shell h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-[#0B1522] text-slate-100">
      <div className="grid h-full min-h-0 w-full grid-rows-[auto_minmax(0,1fr)] overflow-hidden lg:grid-cols-[224px_minmax(0,1fr)] lg:grid-rows-1">
        <Sidebar theme={theme} onThemeChange={setTheme} />

        <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden border-t border-slate-700/40 p-3 sm:p-4 lg:border-l lg:border-t-0">
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
        </main>
      </div>
    </div>
  );
}
