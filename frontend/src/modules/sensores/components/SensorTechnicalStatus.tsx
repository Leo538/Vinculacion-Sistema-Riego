import type { SensorTechnicalStats } from "@/modules/sensores/types";
import { Card } from "@/shared/components/ui/Card";

export function SensorTechnicalStatus({ stats }: { stats: SensorTechnicalStats }) {
  return (
    <Card padding="sm" className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold text-white">Estado técnico</h2>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[10px]">
        <div className="rounded-lg border border-slate-700/35 bg-[#0d1826] p-2">
          <dt className="text-slate-500">Sensores activos</dt>
          <dd className="font-semibold tabular-nums text-white">{stats.activeSensors}</dd>
        </div>
        <div className="rounded-lg border border-slate-700/35 bg-[#0d1826] p-2">
          <dt className="text-slate-500">Desconectados</dt>
          <dd className="font-semibold tabular-nums text-rose-400">{stats.disconnectedSensors}</dd>
        </div>
        <div className="rounded-lg border border-slate-700/35 bg-[#0d1826] p-2">
          <dt className="text-slate-500">Lecturas hoy</dt>
          <dd className="font-semibold tabular-nums text-sky-300">{stats.readingsToday}</dd>
        </div>
        <div className="rounded-lg border border-slate-700/35 bg-[#0d1826] p-2">
          <dt className="text-slate-500">Actualización</dt>
          <dd className="font-medium text-slate-200">{stats.updateFrequency}</dd>
        </div>
      </dl>
    </Card>
  );
}
