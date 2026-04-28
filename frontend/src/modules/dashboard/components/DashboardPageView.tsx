"use client";

import { useEffect, useState } from "react";
import { AlertPanel } from "@/modules/dashboard/components/AlertPanel";
import { ChartPanel } from "@/modules/dashboard/components/ChartPanel";
import { ForecastPanel } from "@/modules/dashboard/components/ForecastPanel";
import { Header } from "@/modules/dashboard/components/Header";
import { IrrigationRecommendation } from "@/modules/dashboard/components/IrrigationRecommendation";
import { SensorPanel } from "@/modules/dashboard/components/SensorPanel";
import { SummaryCard } from "@/modules/dashboard/components/SummaryCard";
import { WeatherPanel } from "@/modules/dashboard/components/WeatherPanel";
import { mockDashboardData } from "@/modules/dashboard/data/mockDashboardData";
import { getOpenMeteoDashboardData } from "@/modules/dashboard/data/openMeteoDashboardData";
import type { DashboardData } from "@/modules/dashboard/types";
import { AppShell } from "@/shared/components/layout/AppShell";

export function DashboardPageView() {
  const [dashboardData, setDashboardData] = useState<DashboardData>(mockDashboardData);

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

  return (
    <AppShell mainClassName="overflow-hidden">
      <Header />

      <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {dashboardData.summaryMetrics.map((metric) => (
          <SummaryCard key={metric.id} metric={metric} />
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,34%)_minmax(0,1fr)] lg:gap-4">
        <WeatherPanel weather={dashboardData.weather} />
        <ForecastPanel forecast={dashboardData.forecast} />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-4">
        <div className="min-h-0 lg:col-span-5">
          <ChartPanel
            title="Humedad suelo (24h)"
            subtitle="Open-Meteo · últimas 24 h (estimación)"
            data={dashboardData.soilHumiditySeries}
          />
        </div>
        <div className="min-h-0 lg:col-span-4">
          <SensorPanel sensors={dashboardData.sensors} />
        </div>
        <div className="flex min-h-0 flex-col gap-3 lg:col-span-3">
          <IrrigationRecommendation irrigation={dashboardData.irrigation} />
          <AlertPanel alerts={dashboardData.alerts} />
        </div>
      </div>
    </AppShell>
  );
}
