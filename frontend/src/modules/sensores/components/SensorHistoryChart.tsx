"use client";

import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SensorHistorySeries } from "@/modules/sensores/types";
import { Card } from "@/shared/components/ui/Card";

const tickStyle = { fill: "#64748b", fontSize: 9 };
const gridStyle = { stroke: "#334155", strokeOpacity: 0.45 };

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

export function SensorHistoryChart({ series }: { series: SensorHistorySeries }) {
  return (
    <Card padding="sm" className="flex h-full min-h-[11rem] flex-col gap-1.5">
      <div>
        <h2 className="text-xs font-semibold text-slate-900 dark:text-white">{series.title}</h2>
        <p className="text-[10px] text-slate-500">{series.subtitle}</p>
      </div>

      <div className="h-40 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series.data} margin={{ top: 4, right: 2, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id={`fill-${series.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={series.color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={series.color} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridStyle} vertical={false} />
            <XAxis dataKey="hour" tick={tickStyle} tickLine={false} axisLine={false} interval={5} />
            <YAxis width={28} tick={tickStyle} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
            <Tooltip
              content={<HistoryTooltip unit={series.unit} metricLabel={series.valueLabel} color={series.color} />}
              cursor={{ stroke: "#e2e8f0", strokeOpacity: 0.75, strokeWidth: 1.1 }}
            />
            <Area type="monotone" dataKey="value" stroke="transparent" fill={`url(#fill-${series.id})`} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={series.color}
              strokeWidth={3}
              dot={false}
              style={{ filter: "drop-shadow(0px 0px 6px rgba(56,189,248,0.4))" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
