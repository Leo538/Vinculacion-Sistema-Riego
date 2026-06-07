"use client";

import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MIN_IOT_CHART_POINTS } from "@/modules/dashboard/lib/iotPresentation";
import type { SensorHistorySeries } from "@/modules/sensores/types";
import { sensorIconMap } from "@/modules/sensores/components/sensorIconMap";
import { Card } from "@/shared/components/ui/Card";
import { IconBox } from "@/shared/components/ui/IconBox";
import { formatChartTooltipMetricLabel, formatChartTooltipUnit } from "@/shared/lib/sensorDisplay";

const tickStyle = { fill: "#94a3b8", fontSize: 9 };
const gridStyle = { stroke: "#475569", strokeOpacity: 0.35 };

function chartLineGlow(color: string): string {
  return `drop-shadow(0 0 5px ${color}) drop-shadow(0 0 14px ${color}99)`;
}

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
  const unitText = formatChartTooltipUnit(unit);
  const valueText =
    raw !== undefined ?
      typeof raw === "number" ?
        unitText ? `${raw} ${unitText}` : `${raw}`
      : `${raw}`
    : "—";
  const metricEs = formatChartTooltipMetricLabel(metricLabel);

  return (
    <div className="min-w-[120px] rounded-lg border border-slate-600/60 bg-[#0f1a2a] px-2.5 py-2 text-xs shadow-xl shadow-black/35">
      <p className="text-[10px] text-slate-400">{label ? `Hora · ${label}` : "—"}</p>
      <p className="mt-1 font-semibold" style={{ color: "#ffffff" }}>
        {valueText}
      </p>
      <p className="text-[10px]" style={{ color }}>
        {metricEs}
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

  if (series.data.length < MIN_IOT_CHART_POINTS) {
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

  const glow = chartLineGlow(series.color);

  return (
    <Card
      padding="sm"
      className="flex h-full min-h-[11rem] flex-col gap-1.5 border-slate-200/80 dark:border-slate-700/50"
      style={{
        boxShadow: `inset 0 1px 0 0 ${series.color}22, 0 0 28px -6px ${series.color}44`
      }}
    >
      <div>
        <h2 className="text-xs font-semibold text-slate-900 dark:text-white">{series.title}</h2>
        <p className="text-[10px] text-slate-500 dark:text-slate-400">{series.subtitle}</p>
      </div>

      <div className="h-40 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series.data} margin={{ top: 6, right: 4, left: -6, bottom: 10 }}>
            <defs>
              <linearGradient id={`fill-${series.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={series.color} stopOpacity={0.55} />
                <stop offset="45%" stopColor={series.color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={series.color} stopOpacity={0.06} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridStyle} vertical={false} />
            <XAxis dataKey="hour" tick={tickStyle} tickLine={false} axisLine={false} interval={5} />
            <YAxis width={28} tick={tickStyle} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
            <Tooltip
              content={<HistoryTooltip unit={series.unit} metricLabel={series.valueLabel} color={series.color} />}
              cursor={{ stroke: series.color, strokeOpacity: 0.55, strokeWidth: 1.25 }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="transparent"
              fill={`url(#fill-${series.id})`}
              fillOpacity={1}
              activeDot={false}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={series.color}
              strokeWidth={2.6}
              fill="none"
              dot={{
                r: 3,
                fill: "#f8fafc",
                stroke: series.color,
                strokeWidth: 1.2
              }}
              activeDot={{
                r: 5,
                strokeWidth: 1.5,
                stroke: "#ffffff",
                fill: series.color
              }}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: glow }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
