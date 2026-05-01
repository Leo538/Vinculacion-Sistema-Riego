"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { sensorIconMap } from "@/modules/sensores/components/sensorIconMap";
import { Card } from "@/shared/components/ui/Card";
import { IconBox } from "@/shared/components/ui/IconBox";

export interface ComparisonLineDef {
  key: string;
  name: string;
  color: string;
}

export interface ComparisonPoint {
  timeLabel: string;
  [key: string]: string | number | null;
}

interface SensorComparisonChartProps {
  title: string;
  subtitle: string;
  unit: string;
  lines: ComparisonLineDef[];
  data: ComparisonPoint[];
  /** Mensaje cuando no hay series (opcional para copy específico). */
  emptyMessage?: string;
  emptyHint?: string;
}

const tickStyle = { fill: "#64748b", fontSize: 9 };

function ComparisonTooltip({
  active,
  payload,
  label,
  unit
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string; color?: string }>;
  label?: string;
  unit: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="min-w-[150px] rounded-lg border border-slate-600/60 bg-[#0f1a2a] px-2.5 py-2 text-xs shadow-xl shadow-black/35">
      <p className="text-[10px] text-slate-400">{label ?? "—"}</p>
      <div className="mt-1 space-y-0.5">
        {payload.map((p, idx) => (
          <p key={`${p.name ?? "line"}-${idx}`} className="text-[10px]" style={{ color: p.color ?? "#fff" }}>
            {(p.name ?? "Serie") + ": "}
            <span className="font-semibold text-white">{p.value ?? "—"}</span>
            {typeof p.value === "number" ? ` ${unit}` : ""}
          </p>
        ))}
      </div>
    </div>
  );
}

export function SensorComparisonChart({
  title,
  subtitle,
  unit,
  lines,
  data,
  emptyMessage = "No hay suficientes sensores compatibles para la comparación.",
  emptyHint = "Prueba con otro rango de tiempo o tipo de sensor."
}: SensorComparisonChartProps) {
  const EmptyIcon = sensorIconMap.activity;

  if (lines.length === 0 || data.length === 0) {
    return (
      <Card padding="sm" className="relative isolate flex items-start gap-3 overflow-hidden border-dashed">
        <IconBox icon={EmptyIcon} className="mt-0.5 size-9 shrink-0" iconSizeClassName="size-3.5" rounded="full" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="text-xs font-semibold text-slate-900 dark:text-white">{title}</h2>
          <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{subtitle}</p>
          <p className="mt-2 text-[10px] font-medium leading-snug text-slate-600 dark:text-slate-300">{emptyMessage}</p>
          {emptyHint ? <p className="mt-1 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">{emptyHint}</p> : null}
        </div>
      </Card>
    );
  }

  const chartHeightPx = 224;

  return (
    <Card padding="sm" className="relative isolate flex h-full min-h-[17.5rem] flex-col gap-3 overflow-visible">
      <div className="shrink-0">
        <h2 className="text-xs font-semibold text-slate-900 dark:text-white">{title}</h2>
        <p className="text-[10px] text-slate-500">{subtitle}</p>
      </div>
      <div className="h-56 w-full min-h-0 shrink-0 pt-1 pb-2">
        <ResponsiveContainer width="100%" height={chartHeightPx} debounce={40}>
          <LineChart data={data} margin={{ top: 4, right: 10, left: -4, bottom: 16 }}>
            <CartesianGrid stroke="#334155" strokeOpacity={0.2} vertical={false} />
            <XAxis dataKey="timeLabel" tick={tickStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
            <YAxis tick={tickStyle} tickLine={false} axisLine={false} width={36} domain={["auto", "auto"]} />
            <Tooltip content={<ComparisonTooltip unit={unit} />} />
            <Legend
              verticalAlign="top"
              align="center"
              layout="horizontal"
              wrapperStyle={{ fontSize: 10, paddingTop: 0, paddingBottom: 10, lineHeight: 1.2 }}
              iconSize={10}
              iconType="circle"
            />
            {lines.map((line) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.name}
                stroke={line.color}
                strokeWidth={2}
                dot={false}
                connectNulls
                activeDot={{ r: 3.5 }}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
