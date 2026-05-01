"use client";

import dynamic from "next/dynamic";
import type { ComparisonLineDef, ComparisonPoint } from "@/modules/sensores/components/SensorComparisonChart";

const SensorComparisonChart = dynamic(
  () => import("@/modules/sensores/components/SensorComparisonChart").then((m) => m.SensorComparisonChart),
  {
    loading: () => (
      <div className="min-h-[17.5rem] w-full min-w-0 animate-pulse rounded-xl border border-slate-700/40 bg-slate-800/30" />
    ),
    ssr: false
  }
);

interface SensorComparisonChartLazyProps {
  title: string;
  subtitle: string;
  unit: string;
  lines: ComparisonLineDef[];
  data: ComparisonPoint[];
}

export function SensorComparisonChartLazy({
  title,
  subtitle,
  unit,
  lines,
  data
}: SensorComparisonChartLazyProps) {
  return (
    <div className="min-h-[17.5rem] min-w-0 w-full">
      <SensorComparisonChart title={title} subtitle={subtitle} unit={unit} lines={lines} data={data} />
    </div>
  );
}
