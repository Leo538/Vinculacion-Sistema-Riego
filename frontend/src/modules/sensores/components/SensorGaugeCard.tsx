import type { SensorGaugeItem } from "@/modules/sensores/types";
import { sensorIconMap } from "@/modules/sensores/components/sensorIconMap";
import { Card } from "@/shared/components/ui/Card";
import { IconBox } from "@/shared/components/ui/IconBox";
import type { CSSProperties } from "react";

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
  const Icon = sensorIconMap[sensor.iconKey];
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
    <Card className="flex flex-col gap-2 !px-6 !pb-5 !pt-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">{sensor.label}</p>
          {sensor.subtitle ? (
            <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-slate-500 dark:text-slate-400">
              {sensor.subtitle}
            </p>
          ) : (
            <p className="mt-1 text-[10px] text-slate-500">Lectura instantánea</p>
          )}
        </div>
        <IconBox icon={Icon} className="size-8" iconSizeClassName="size-3.5" rounded="full" />
      </div>

      <div className="flex min-h-0 flex-col items-center pt-1">
        <div className="relative mx-auto mb-1 h-[134px] w-[232px] max-w-full shrink-0">
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
              className="sensor-gauge-fill"
              strokeWidth="24"
              strokeLinecap="round"
              strokeDasharray={arcLength}
              strokeDashoffset={arcLength}
              style={
                {
                  filter: "drop-shadow(0px 0px 10px rgba(59,130,246,0.4))",
                  "--gauge-target-offset": dashOffset
                } as CSSProperties
              }
            />
          </svg>

          <div className="absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-[1.65rem] font-bold leading-none text-slate-900 dark:text-white">{sensor.displayValue}</div>
            <div className="mt-2 text-sm text-slate-400">
              Rango {sensor.min} - {sensor.max} {sensor.unit}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 justify-center pt-2 pb-0.5">
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold shadow-sm ${badgeClass}`}>{status}</span>
        </div>
      </div>
    </Card>
  );
}
