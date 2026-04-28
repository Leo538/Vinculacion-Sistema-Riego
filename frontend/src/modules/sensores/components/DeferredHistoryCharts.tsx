"use client";

import { useState } from "react";
import type { SensorHistorySeries } from "@/modules/sensores/types";
import { SensorHistoryChartLazy } from "@/modules/sensores/components/SensorHistoryChartLazy";

interface DeferredHistoryChartsProps {
  seriesList: SensorHistorySeries[];
}

export function DeferredHistoryCharts({ seriesList }: DeferredHistoryChartsProps) {
  const [showCharts, setShowCharts] = useState(false);
  if (seriesList.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setShowCharts(true)}
        className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/20"
      >
        Cargar gráficas adicionales
      </button>

      {showCharts
        ? seriesList.map((series, idx) => (
            <SensorHistoryChartLazy key={series.id} series={series} mountDelayMs={120 + idx * 140} />
          ))
        : null}
    </>
  );
}
