import { Activity, Droplets, Thermometer, Waves } from "lucide-react";
import type { SensorDetailRow } from "@/modules/sensores/types";
import { Card } from "@/shared/components/ui/Card";
import { IconBox } from "@/shared/components/ui/IconBox";

const iconMap = {
  droplets: Droplets,
  thermometer: Thermometer,
  waves: Waves,
  activity: Activity
} as const;

export function SensorStatusList({ rows }: { rows: SensorDetailRow[] }) {
  return (
    <Card padding="sm" className="flex min-h-0 flex-col gap-2">
      <div className="flex items-center justify-between gap-2 border-b border-slate-700/40 pb-2">
        <h2 className="text-xs font-semibold text-white">Sensores</h2>
        <span className="text-[10px] text-slate-500">Detalle por zona</span>
      </div>
      <ul className="grid min-h-0 gap-2">
        {rows.map((row) => {
          const Icon = iconMap[row.iconKey];
          return (
            <li
              key={row.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-700/35 bg-[#0d1826] p-2"
            >
              <IconBox icon={Icon} className="size-8" iconSizeClassName="size-3.5" rounded="full" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-medium text-slate-200">{row.name}</p>
                <p className="truncate text-[10px] text-slate-500">{row.zone}</p>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-right">
                <div>
                  <p className="text-sm font-semibold tabular-nums text-white">{row.value}</p>
                  <p className="text-[10px] text-slate-500">{row.lastReading}</p>
                </div>
                <span
                  className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                    row.online
                      ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-400"
                      : "border-rose-500/35 bg-rose-500/10 text-rose-400"
                  }`}
                >
                  {row.statusLabel}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
