"use client";

import { Activity, CloudRain, Droplets, Gauge, Sun, Thermometer, Waves } from "lucide-react";
import type { SensorGaugeItem } from "@/modules/sensores/types";
import { Card } from "@/shared/components/ui/Card";
import { IconBox } from "@/shared/components/ui/IconBox";

const iconMap = {
  droplets: Droplets,
  thermometer: Thermometer,
  waves: Waves,
  activity: Activity,
  "cloud-rain": CloudRain,
  sun: Sun,
  gauge: Gauge
} as const;

function clampPct(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function getGaugeColor(pct: number): string {
  if (pct <= 30) return "#f59e0b";
  if (pct > 70) return "#ef4444";
  return "#22c55e";
}

function getGaugeStatus(pct: number): string {
  if (pct > 70) return "Crítico";
  if (pct <= 30) return "Advertencia";
  return "Normal";
}

export function SensorGaugeCard({ sensor }: { sensor: SensorGaugeItem }) {
  const Icon = iconMap[sensor.iconKey];
  const ratio = ((sensor.value - sensor.min) / (sensor.max - sensor.min || 1)) * 100;
  const percent = clampPct(ratio);
  const gaugeColor = getGaugeColor(percent);
  const status = getGaugeStatus(percent);
  const arcLength = 314;
  const dashOffset = arcLength * (1 - percent / 100);
  const badgeClass =
    status === "Normal"
      ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-400"
      : status === "Advertencia"
        ? "border-amber-500/60 bg-amber-500/10 text-amber-400"
        : "border-rose-500/60 bg-rose-500/10 text-rose-300";

  return (
    <Card className="flex h-[258px] flex-col justify-between gap-2 !p-6">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">{sensor.label}</p>
          <p className="text-[10px] text-slate-500">Lectura instantánea</p>
        </div>
        <IconBox icon={Icon} className="size-8" iconSizeClassName="size-3.5" rounded="full" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center pb-2">
        <div className="relative mx-auto mt-4 h-[150px] w-[260px] max-w-full">
          <svg viewBox="0 0 260 150" className="absolute inset-0 h-full w-full" aria-hidden>
            <path
              d="M30 125 A100 100 0 0 1 230 125"
              fill="none"
              stroke="currentColor"
              className="text-slate-300 dark:text-[#1B2A3D]"
              strokeWidth="24"
              strokeLinecap="round"
            />
            <path
              d="M30 125 A100 100 0 0 1 230 125"
              fill="none"
              stroke={gaugeColor}
              strokeWidth="24"
              strokeLinecap="round"
              strokeDasharray={arcLength}
              strokeDashoffset={dashOffset}
              style={{ filter: "drop-shadow(0px 0px 10px rgba(59,130,246,0.4))" }}
            />
          </svg>

          <div className="absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-[1.65rem] font-bold leading-none text-slate-900 dark:text-white">{sensor.displayValue}</div>
            <div className="mt-2 text-sm text-slate-400">
              Rango {sensor.min} - {sensor.max} {sensor.unit}
            </div>
          </div>
        </div>

        <div className="mt-1 flex justify-center">
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass}`}>{status}</span>
        </div>
      </div>
    </Card>
  );
}
