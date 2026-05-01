import type { SensorReadingResponse } from "@/lib/api/types";
import { sensorIconMap } from "@/modules/sensores/components/sensorIconMap";
import { formatRelativeTime, formatValueWithUnit, isReadingRecent } from "@/modules/dashboard/lib/iotPresentation";
import { formatSensorTypeTitle, getSensorSubtitle } from "@/shared/lib/sensorDisplay";
import { Card } from "@/shared/components/ui/Card";
import { IconBox } from "@/shared/components/ui/IconBox";
import type { SensorIconKey } from "@/modules/sensores/types";

function iconKeyFor(r: SensorReadingResponse): SensorIconKey {
  const t = `${r.type} ${r.sensorId}`.toLowerCase();
  if (/temp/.test(t)) return "thermometer";
  if (/press|hpa/.test(t)) return "gauge";
  if (/flow|caudal/.test(t)) return "activity";
  if (/tank|tanque/.test(t)) return "waves";
  return "droplets";
}

export function SensorPlainReadingCard({ reading }: { reading: SensorReadingResponse }) {
  const Icon = sensorIconMap[iconKeyFor(reading)];
  const online = isReadingRecent(reading.timestamp);
  const title = formatSensorTypeTitle(reading.type);
  const subtitle = getSensorSubtitle(reading.sensorId, reading.timestamp);

  return (
    <Card className="flex min-h-[258px] flex-col gap-4 !p-6">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">{title}</p>
          <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-slate-500 dark:text-slate-400">{subtitle}</p>
          <p className="mt-1 text-[9px] text-slate-500">Lectura directa (sin escala tipo gauge)</p>
        </div>
        <IconBox icon={Icon} className="size-8" iconSizeClassName="size-3.5" rounded="full" />
      </div>
      <div className="flex flex-1 flex-col justify-center gap-2 pb-2">
        <p className="text-center text-[1.65rem] font-bold leading-none text-slate-900 dark:text-white">
          {formatValueWithUnit(reading.value, reading.unit)}
        </p>
        <p className={`text-center text-[10px] font-medium ${online ? "text-emerald-400" : "text-amber-300"}`}>
          {online ? "En línea" : "Fuera de línea"} · {formatRelativeTime(reading.timestamp)}
        </p>
      </div>
    </Card>
  );
}
