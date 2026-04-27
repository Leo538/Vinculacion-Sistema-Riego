"use client";

import { useEffect, useState } from "react";
import { AlertPanel } from "@/components/dashboard/AlertPanel";
import { ChartPanel } from "@/components/dashboard/ChartPanel";
import { ForecastPanel } from "@/components/dashboard/ForecastPanel";
import { Header } from "@/components/dashboard/Header";
import { IrrigationRecommendation } from "@/components/dashboard/IrrigationRecommendation";
import { SensorPanel } from "@/components/dashboard/SensorPanel";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { WeatherPanel } from "@/components/dashboard/WeatherPanel";
import { Sidebar } from "@/components/layout/Sidebar";
import { mockDashboardData } from "@/data/mockDashboardData";
import { getOpenMeteoDashboardData } from "@/data/openMeteoDashboardData";
import type { DashboardData } from "@/types/dashboard.types";

export default function HomePage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [dashboardData, setDashboardData] = useState<DashboardData>(mockDashboardData);

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
    <div className="dashboard-shell h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-[#0B1522] text-slate-100">
      <div className="grid h-full min-h-0 w-full grid-rows-[auto_minmax(0,1fr)] overflow-hidden lg:grid-cols-[224px_minmax(0,1fr)] lg:grid-rows-1">
        <Sidebar theme={theme} onThemeChange={setTheme} />

        <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden border-t border-slate-700/40 p-3 sm:p-4 lg:border-l lg:border-t-0">
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
        </main>
      </div>
    </div>
  );
}
