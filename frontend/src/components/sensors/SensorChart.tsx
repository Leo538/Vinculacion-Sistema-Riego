"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { SensorSeriesPoint } from "@/types/sensors.types";
import { Card } from "@/components/ui/Card";

interface SensorChartProps {
  title: string;
  subtitle?: string;
  data: SensorSeriesPoint[];
  valueLabel: string;
  /** Sufijo de unidad en tooltips (%, °C, etc.) */
  unit: string;
  color?: string;
}

const tickStyle = { fill: "#64748b", fontSize: 9 };
const gridStyle = { stroke: "#334155", strokeOpacity: 0.45 };

export function SensorChart({
  title,
  subtitle,
  data,
  valueLabel,
  unit,
  color = "#38bdf8"
}: SensorChartProps) {
  if (data.length === 0) {
    return null;
  }

  const tickInterval = 5;

  return (
    <Card padding="sm" className="flex min-h-0 flex-col gap-1.5">
      <div>
        <h2 className="text-xs font-semibold text-white">{title}</h2>
        {subtitle ? <p className="text-[10px] text-slate-500">{subtitle}</p> : null}
      </div>
      <div className="h-[120px] w-full min-h-0 sm:h-[128px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid {...gridStyle} vertical={false} />
            <XAxis
              dataKey="hour"
              tick={tickStyle}
              tickLine={false}
              axisLine={false}
              interval={tickInterval}
            />
            <YAxis
              width={28}
              tick={tickStyle}
              tickLine={false}
              axisLine={false}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f1a2a",
                border: "1px solid rgba(51,65,85,0.6)",
                borderRadius: 8,
                fontSize: 11,
                color: "#e2e8f0"
              }}
              labelStyle={{ color: "#94a3b8" }}
              formatter={(v) => [`${v} ${unit}`.trim(), valueLabel]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={1.75}
              dot={false}
              activeDot={{ r: 3, fill: color, stroke: "#0B1522", strokeWidth: 1 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
