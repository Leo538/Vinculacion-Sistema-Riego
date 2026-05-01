import type { SensorBarIndicatorItem } from "@/modules/sensores/types";
import { sensorIconMap } from "@/modules/sensores/components/sensorIconMap";
import { Card } from "@/shared/components/ui/Card";
import { IconBox } from "@/shared/components/ui/IconBox";
import type { CSSProperties } from "react";

const levelTone = {
  low: {
    label: "Bajo",
    text: "text-amber-300",
    bar: "from-amber-400 to-amber-300"
  },
  normal: {
    label: "Normal",
    text: "text-emerald-400",
    bar: "from-emerald-500 to-emerald-300"
  },
  high: {
    label: "Alto",
    text: "text-amber-300",
    bar: "from-amber-500 to-yellow-300"
  },
  critical: {
    label: "Crítico",
    text: "text-rose-300",
    bar: "from-rose-500 to-orange-400"
  }
} as const;

export function SensorBarIndicator({ item }: { item: SensorBarIndicatorItem }) {
  const Icon = sensorIconMap[item.iconKey];
  const pct = Math.max(0, Math.min(100, ((item.value - item.min) / (item.max - item.min || 1)) * 100));
  const tone = levelTone[item.level];
  const showBar = item.showPercentBar !== false;

  return (
    <Card padding="sm" className="flex h-full min-h-[7.25rem] w-full flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold text-slate-800 dark:text-slate-200">{item.label}</p>
          {item.subtitle ? (
            <p className="truncate text-[9px] font-medium leading-snug text-slate-500 dark:text-slate-400">{item.subtitle}</p>
          ) : null}
          <p
            className={`text-[10px] font-medium ${showBar ? tone.text : "text-slate-500 dark:text-slate-500"} ${item.subtitle ? "mt-0.5" : ""}`}
          >
            {showBar ? (item.caption ?? tone.label) : (item.caption ?? "Fuente: Open-Meteo")}
          </p>
        </div>
        <IconBox icon={Icon} className="size-8" iconSizeClassName="size-3.5" rounded="full" />
      </div>

      {showBar ? (
        <div>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.displayValue}</p>
            <p className="text-[10px] text-slate-500">{Math.round(pct)}%</p>
          </div>
          <div className="h-2.5 rounded-full bg-slate-300/75 dark:bg-slate-800/80">
            <div
              className={`sensor-bar-fill h-full rounded-full bg-gradient-to-r ${tone.bar} shadow-[0_0_10px_rgba(56,189,248,0.25)]`}
              style={{ "--sensor-bar-target-width": `${pct}%` } as CSSProperties}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-center gap-1">
          <p className="text-lg font-semibold leading-tight text-slate-900 dark:text-white">{item.displayValue}</p>
          <p className="text-[10px] leading-snug text-slate-500">Referencia externa · no es un sensor IoT</p>
        </div>
      )}
    </Card>
  );
}
