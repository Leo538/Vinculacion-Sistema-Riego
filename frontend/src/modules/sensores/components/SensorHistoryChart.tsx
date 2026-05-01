"use client";

import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SensorHistorySeries } from "@/modules/sensores/types";
import { sensorIconMap } from "@/modules/sensores/components/sensorIconMap";
import { Card } from "@/shared/components/ui/Card";
import { IconBox } from "@/shared/components/ui/IconBox";

const tickStyle = { fill: "#64748b", fontSize: 9 };
const gridStyle = { stroke: "#334155", strokeOpacity: 0.2 };

function HistoryTooltip({
  active,
  payload,
  label,
  unit,
  metricLabel,
  color
}: {
  active?: boolean;
  payload?: Array<{ value?: number | string }>;
  label?: string;
  unit: string;
  metricLabel: string;
  color: string;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const first = payload.find((p) => typeof p.value === "number" || typeof p.value === "string");
  const raw = first?.value;
  const valueText = raw !== undefined ? `${raw} ${unit}`.trim() : "—";

  return (
    <div className="min-w-[120px] rounded-lg border border-slate-600/60 bg-[#0f1a2a] px-2.5 py-2 text-xs shadow-xl shadow-black/35">
      <p className="text-[10px] text-slate-400">{label ?? "—"}</p>
      <p className="mt-1 font-semibold" style={{ color: "#ffffff" }}>
        {valueText}
      </p>
      <p className="text-[10px]" style={{ color }}>
        {metricLabel}
      </p>
    </div>
  );
}

interface SensorHistoryChartProps {
  series: SensorHistorySeries;
  emptyPrimary?: string;
  emptyHint?: string;
}

export function SensorHistoryChart({
  series,
  emptyPrimary = "No se encontraron lecturas históricas para el rango seleccionado.",
  emptyHint = "Prueba con otro rango de tiempo o tipo de sensor."
}: SensorHistoryChartProps) {
  const HistIcon = sensorIconMap.activity;

  if (!series.data.length) {
    return (
      <Card padding="sm" className="flex items-start gap-3 border-dashed">
        <IconBox icon={HistIcon} className="mt-0.5 size-9 shrink-0" iconSizeClassName="size-3.5" rounded="full" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="text-xs font-semibold text-slate-900 dark:text-white">{series.title}</h2>
          <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{series.subtitle}</p>
          <p className="mt-2 text-[10px] font-medium leading-snug text-slate-600 dark:text-slate-300">{emptyPrimary}</p>
          {emptyHint ? <p className="mt-1 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">{emptyHint}</p> : null}
        </div>
      </Card>
    );
  }

  return (
    <Card padding="sm" className="flex h-full min-h-[11rem] flex-col gap-1.5">
      <div>
        <h2 className="text-xs font-semibold text-slate-900 dark:text-white">{series.title}</h2>
        <p className="text-[10px] text-slate-500">{series.subtitle}</p>
      </div>

      <div className="h-40 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series.data} margin={{ top: 6, right: 4, left: -6, bottom: 10 }}>
            <defs>
              <linearGradient id={`fill-${series.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={series.color} stopOpacity={0.26} />
                <stop offset="100%" stopColor={series.color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridStyle} vertical={false} />
            <XAxis dataKey="hour" tick={tickStyle} tickLine={false} axisLine={false} interval={5} />
            <YAxis width={28} tick={tickStyle} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
            <Tooltip
              content={<HistoryTooltip unit={series.unit} metricLabel={series.valueLabel} color={series.color} />}
              cursor={{ stroke: "#e2e8f0", strokeOpacity: 0.75, strokeWidth: 1.1 }}
            />
            <Area type="monotone" dataKey="value" stroke="transparent" fill={`url(#fill-${series.id})`} fillOpacity={1} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={series.color}
              strokeWidth={2.2}
              strokeOpacity={1}
              fill="none"
              dot={false}
              activeDot={false}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                filter: "drop-shadow(0px 0px 4px rgba(56,189,248,0.55)) drop-shadow(0px 0px 10px rgba(56,189,248,0.32))"
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={series.color}
              strokeWidth={3}
              strokeOpacity={1}
              dot={{
                r: 2.8,
                fill: "#93c5fd",
                stroke: "#3b82f6",
                strokeWidth: 0.8
              }}
              activeDot={{
                r: 4,
                strokeWidth: 0.9,
                stroke: "#ffffff",
                fill: series.color
              }}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                filter: "drop-shadow(0px 0px 2px rgba(255,255,255,0.4)) drop-shadow(0px 0px 8px rgba(56,189,248,0.45))"
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
