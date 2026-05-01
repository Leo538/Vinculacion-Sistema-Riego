import type { SensorTechnicalStats } from "@/modules/sensores/types";
import { Card } from "@/shared/components/ui/Card";

export function SensorTechnicalSummary({ stats }: { stats: SensorTechnicalStats }) {
  return (
    <Card padding="sm" className="h-full">
      <h2 className="mb-2 text-xs font-semibold text-slate-900 dark:text-white">Estado técnico</h2>
      <dl className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="rounded-lg border border-[#CBDDF5] bg-[#EEF5FF] p-2 dark:border-slate-700/35 dark:bg-[#0d1826]">
          <dt className="text-slate-500 dark:text-slate-500">Sensores activos</dt>
          <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">{stats.activeSensors}</dd>
        </div>
        <div className="rounded-lg border border-[#CBDDF5] bg-[#EEF5FF] p-2 dark:border-slate-700/35 dark:bg-[#0d1826]">
          <dt className="text-slate-500">Desconectados</dt>
          <dd className="font-semibold tabular-nums text-rose-300">{stats.disconnectedSensors}</dd>
        </div>
        <div className="rounded-lg border border-[#CBDDF5] bg-[#EEF5FF] p-2 dark:border-slate-700/35 dark:bg-[#0d1826]">
          <dt className="text-slate-500">Lecturas hoy</dt>
          <dd className="font-semibold tabular-nums text-sky-300">
            {stats.readingsToday === null ? "—" : stats.readingsToday}
          </dd>
        </div>
        <div className="rounded-lg border border-[#CBDDF5] bg-[#EEF5FF] p-2 dark:border-slate-700/35 dark:bg-[#0d1826]">
          <dt className="text-slate-500">Frecuencia</dt>
          <dd className="font-medium text-slate-700 dark:text-slate-200">{stats.updateFrequency}</dd>
        </div>
      </dl>
    </Card>
  );
}
