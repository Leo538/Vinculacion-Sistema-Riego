"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { SensorHistorySeries } from "@/modules/sensores/types";
import { Card } from "@/shared/components/ui/Card";

const SensorHistoryChart = dynamic(
  () => import("@/modules/sensores/components/SensorHistoryChart").then((m) => m.SensorHistoryChart),
  {
    loading: () => (
      <Card className="h-[11rem] animate-pulse">
        <div className="h-full w-full rounded-lg bg-slate-800/30" />
      </Card>
    ),
    ssr: false
  }
);

function HistoryChartSkeleton() {
  return (
    <Card className="h-[11rem] animate-pulse">
      <div className="h-full w-full rounded-lg bg-slate-800/30" />
    </Card>
  );
}

interface SensorHistoryChartLazyProps {
  series: SensorHistorySeries;
  mountDelayMs?: number;
  eager?: boolean;
}

export function SensorHistoryChartLazy({ series, mountDelayMs = 0, eager = false }: SensorHistoryChartLazyProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [shouldMountChart, setShouldMountChart] = useState(eager);

  useEffect(() => {
    if (eager) return;
    const root = rootRef.current;
    if (!root) return;
    let timer: number | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting);
        if (!isVisible) return;
        if (mountDelayMs <= 0) {
          setShouldMountChart(true);
        } else {
          timer = window.setTimeout(() => setShouldMountChart(true), mountDelayMs);
        }
        observer.disconnect();
      },
      { rootMargin: "220px 0px" }
    );

    observer.observe(root);
    return () => {
      observer.disconnect();
      if (timer !== null) {
        window.clearTimeout(timer);
      }
    };
  }, [eager, mountDelayMs]);

  return <div ref={rootRef}>{shouldMountChart ? <SensorHistoryChart series={series} /> : <HistoryChartSkeleton />}</div>;
}
