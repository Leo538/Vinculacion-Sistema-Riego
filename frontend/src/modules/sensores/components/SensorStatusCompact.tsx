import type { SensorCompactStatusItem } from "@/modules/sensores/types";
import { sensorIconMap } from "@/modules/sensores/components/sensorIconMap";
import { Card } from "@/shared/components/ui/Card";
import { IconBox } from "@/shared/components/ui/IconBox";

export function SensorStatusCompact({ sensors }: { sensors: SensorCompactStatusItem[] }) {
  return (
    <Card padding="sm" className="h-full">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-slate-900 dark:text-white">Sensores en línea</h2>
        <span className="text-[10px] text-slate-500">Estado actual</span>
      </div>
      {sensors.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-600/40 bg-slate-900/15 px-3 py-3 text-center md:py-4">
          <p className="text-[10px] font-medium leading-snug text-slate-600 dark:text-slate-300">
            Sin sensores que mostrar con los filtros actuales.
          </p>
          <p className="mt-1 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
            Prueba con otro tipo de sensor o ajusta el estado.
          </p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {sensors.map((sensor) => {
            const Icon = sensorIconMap[sensor.iconKey];
            return (
              <li
                key={sensor.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-[#CBDDF5] bg-[#EEF5FF] px-2 py-1.5 dark:border-slate-700/35 dark:bg-[#0d1826]"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <IconBox icon={Icon} className="size-7" iconSizeClassName="size-3" rounded="full" />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-medium text-slate-700 dark:text-slate-200">
                      {sensor.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[9px] leading-snug text-slate-500 dark:text-slate-400">
                      {sensor.subtitle}
                    </span>
                  </div>
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
      )}
    </Card>
  );
}
