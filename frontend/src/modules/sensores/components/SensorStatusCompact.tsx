import { Activity, CloudRain, Droplets, Gauge, Sun, Thermometer, Waves } from "lucide-react";
import type { SensorCompactStatusItem } from "@/modules/sensores/types";
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

export function SensorStatusCompact({ sensors }: { sensors: SensorCompactStatusItem[] }) {
  return (
    <Card padding="sm" className="h-full">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-slate-900 dark:text-white">Sensores en línea</h2>
        <span className="text-[10px] text-slate-500">Estado actual</span>
      </div>
      <ul className="space-y-1.5">
        {sensors.map((sensor) => {
          const Icon = iconMap[sensor.iconKey];
          return (
            <li
              key={sensor.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-[#CBDDF5] bg-[#EEF5FF] px-2 py-1.5 dark:border-slate-700/35 dark:bg-[#0d1826]"
            >
              <div className="flex min-w-0 items-center gap-2">
                <IconBox icon={Icon} className="size-7" iconSizeClassName="size-3" rounded="full" />
                <span className="truncate text-[11px] text-slate-700 dark:text-slate-200">{sensor.name}</span>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-medium text-slate-900 dark:text-white">{sensor.value}</p>
                <span
                  className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-medium ${
                    sensor.online
                      ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-400"
                      : "border-rose-500/35 bg-rose-500/10 text-rose-300"
                  }`}
                >
                  {sensor.online ? "En línea" : "Fuera de línea"}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
