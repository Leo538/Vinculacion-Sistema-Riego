import { CloudRain, Droplets, Gauge, Thermometer, Waves, Wind } from "lucide-react";
import type { SensorReading } from "@/modules/dashboard/types";
import { formatStatusLabel } from "@/modules/dashboard/utils/statusFormat";
import { Card } from "@/shared/components/ui/Card";
import { DashboardScrollArea } from "@/shared/components/ui/DashboardScrollArea";
import { IconBox } from "@/shared/components/ui/IconBox";

const iconById: Record<string, typeof Droplets> = {
  s1: Droplets,
  s2: Thermometer,
  s3: Droplets,
  s4: Gauge,
  s5: Wind,
  s6: CloudRain,
  s7: Waves
};

export function SensorPanel({ sensors }: { sensors: SensorReading[] }) {
  return (
    <Card className="flex h-full max-h-full min-h-0 flex-col overflow-hidden" padding="sm">
      <h2 className="mb-2 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Sensores</h2>
      <DashboardScrollArea as="ul" className="space-y-1.5">
        {sensors.map((sensor) => {
          const Icon = iconById[sensor.id] ?? Droplets;
          const online = sensor.status === "online";
          return (
            <li
              key={sensor.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-[#CBDDF5] bg-[#EEF5FF] px-2.5 py-1.5 transition hover:border-sky-300/70 dark:border-slate-700/40 dark:bg-[#0f1b2d] dark:hover:border-slate-600/50"
            >
              <div className="flex min-w-0 items-center gap-2">
                <IconBox icon={Icon} className="size-8" iconSizeClassName="size-3.5" rounded="full" />
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-medium text-slate-800 dark:text-slate-200">{sensor.name}</p>
                  <p className="text-[9px] text-slate-600">{sensor.updatedAt}</p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[11px] font-semibold text-slate-900 dark:text-slate-100">{sensor.value}</p>
                <span
                  className={`mt-0.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-medium ${
                    online
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]"
                      : "border-amber-500/35 bg-amber-500/10 text-amber-300"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_6px_currentColor]" />
                  {formatStatusLabel(sensor.status)}
                </span>
              </div>
            </li>
          );
        })}
      </DashboardScrollArea>
    </Card>
  );
}
