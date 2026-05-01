"use client";

import type { SVGProps } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Card } from "@/shared/components/ui/Card";
import type { DailyMeteoRecoRow, EvolutionRow, RiegoTimeRangeKey, SoilTrendRow } from "@/modules/riego/lib/buildRiegoChartData";
import { RIEGO_CHART_EMPTY_MESSAGE, irrigationAxisLabel } from "@/modules/riego/lib/buildRiegoChartData";

const GRID_STYLE = { stroke: "#334155", strokeOpacity: 0.2 };
const tickStyle = { fill: "#64748b", fontSize: 10 };

type DailyIndexYTickOuter = SVGProps<SVGTextElement> & {
  x?: number;
  y?: number;
  payload?: { value?: number };
};

/** Etiquetas Y del índice diario en 2 líneas cuando conviene para no recortar el texto */
function DailyIndexYAxisTick(props: DailyIndexYTickOuter) {
  const { x = 0, y = 0, payload } = props;
  const v = typeof payload?.value === "number" ? payload.value : Number(payload?.value ?? 1);
  const rows =
    v >= 4
      ? ["Regar"]
      : v >= 3
        ? ["Esperar lluvia"]
        : v >= 2
          ? ["No regar"]
          : ["Sin datos", "suelo"];
  const lineHeight = 11;
  const offsetY = rows.length > 1 ? -(lineHeight * (rows.length - 1)) / 2 : 0;
  const tx = x - 4;
  return (
    <text x={tx} y={y} textAnchor="end" dominantBaseline="middle" fill="#64748b" fontSize={9}>
      {rows.map((line, i) => (
        <tspan key={`${line}-${i}`} x={tx} dy={i === 0 ? offsetY : lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

type DailyIndexXTickOuter = SVGProps<SVGTextElement> & {
  x?: number;
  y?: number;
  payload?: { value?: string };
};

function DailyIndexXAxisTick(props: DailyIndexXTickOuter) {
  const { x = 0, y = 0, payload } = props;
  const label = typeof payload?.value === "string" ? payload.value : "";
  return (
    <text
      x={x}
      y={y}
      transform={`rotate(-28 ${x},${y})`}
      fill="#64748b"
      fontSize={10}
      textAnchor="end"
      dominantBaseline="middle"
    >
      {label}
    </text>
  );
}

function DailyIndexBarTooltip({
  active,
  payload
}: {
  active?: boolean;
  payload?: Array<{ payload: DailyMeteoRecoRow }>;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  const dayLine =
    row.isoDate ?
      new Date(`${row.isoDate}T12:00:00`).toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "short" })
      : row.dayShort;
  return (
    <div className="min-w-[178px] max-w-[260px] rounded-lg border border-slate-600/60 bg-[#0f1a2a] px-2.5 py-2 text-[10px] leading-snug shadow-xl shadow-black/35">
      <p className="font-semibold capitalize text-white">{dayLine}</p>
      <p className="mt-1 text-sky-300/95">{row.recomendacion}</p>
      <p className="mt-1 text-slate-500">
        Índice: <span className="tabular-nums font-medium text-slate-300">{row.recNivel}</span>
        {" · "}
        <span className="text-slate-400">{row.lluviaPct}% lluvia (máx.)</span>
      </p>
    </div>
  );
}

const EVOLUTION_RANGE_COPY: Record<RiegoTimeRangeKey, string> = {
  "24h": "últimas 24 h IoT seleccionadas",
  "7d": "últimos 7 días IoT (etiquetas con día y hora)",
  "30d": "últimos 30 días IoT (etiquetas con día y hora)"
};

function ChartShell({
  title,
  subtitle,
  children,
  empty,
  emptyMessage = RIEGO_CHART_EMPTY_MESSAGE,
  stackedCharts,
  belowChart
}: {
  title: string;
  subtitle?: string;
  empty: boolean;
  emptyMessage?: string;
  stackedCharts?: boolean;
  belowChart?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card padding="sm" className="flex flex-col gap-2 overflow-visible">
      <div className="shrink-0">
        <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
      </div>
      <div className="relative isolate w-full pt-2">
        {empty ? (
          <p className="flex min-h-[200px] items-center justify-center px-4 text-center text-[11px] font-semibold leading-relaxed text-amber-200/95 dark:text-amber-200">
            {emptyMessage}
          </p>
        ) : stackedCharts ? (
          <div className="flex w-full flex-col gap-6">{children}</div>
        ) : (
          <div className="h-[248px] w-full sm:h-[268px]">{children}</div>
        )}
        {!empty && belowChart ? <div className="mt-2">{belowChart}</div> : null}
      </div>
    </Card>
  );
}

function EvolutionTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: EvolutionRow }> }) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;
  return (
    <div className="min-w-[160px] rounded-lg border border-slate-600/60 bg-[#0f1a2a] px-2.5 py-2 text-[10px] shadow-xl shadow-black/35">
      <p className="text-slate-400">{p.timeLabel}</p>
      <p className="mt-1 font-semibold text-white">{p.accion}</p>
      <p className="mt-1 text-slate-500">
        Índice: <span className="tabular-nums text-slate-300">{p.nivel}</span>
      </p>
    </div>
  );
}

export function RiegoChartsPanel(props: {
  evolution: EvolutionRow[];
  evolutionRangeKey: RiegoTimeRangeKey;
  weekly: DailyMeteoRecoRow[];
  soilTrend: SoilTrendRow[];
  soilTrendEmptyMessage: string;
  soilTrendInsufficient: boolean;
  soilTrendInsufficientMessage: string;
}) {
  const evolutionEmpty = props.evolution.length === 0;
  const weeklyMeteoEmpty = props.weekly.length === 0;
  const soilEmpty = props.soilTrend.length === 0;
  const evolutionSubtitle = `${EVOLUTION_RANGE_COPY[props.evolutionRangeKey]} · prob. lluvia horaria Open‑Meteo (si falta pronóstico, se trata como 0 %).`;

  const soilTrendSubtitleParts: Record<RiegoTimeRangeKey, string> = {
    "24h": "Últimas 24 h · promedio por hora local (humedad de suelo IoT)",
    "7d": "Últimos 7 días · media diaria por día calendario",
    "30d": "Últimos 30 días · media diaria por día calendario"
  };

  const soilTrendBelowChart =
    !soilEmpty && props.soilTrendInsufficient ? (
      <p className="rounded-md border border-amber-600/35 bg-amber-500/[0.06] px-2 py-1.5 text-center text-[10px] leading-snug text-amber-200/95 dark:text-amber-200">
        {props.soilTrendInsufficientMessage}
      </p>
    ) : undefined;

  return (
    <div className="grid w-full grid-cols-1 gap-5 lg:gap-6">
      <ChartShell
        title="Evolución de la recomendación de riego"
        subtitle={evolutionSubtitle}
        empty={evolutionEmpty}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={props.evolution} margin={{ top: 6, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid {...GRID_STYLE} vertical={false} />
            <XAxis dataKey="timeLabel" tick={tickStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={18} />
            <YAxis
              width={36}
              domain={[1, 4]}
              ticks={[1, 2, 3, 4]}
              tickFormatter={(v: number) => irrigationAxisLabel(v)}
              tick={tickStyle}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<EvolutionTooltip />} />
            <Line
              type="stepAfter"
              dataKey="nivel"
              name="Recomendación"
              stroke="#38bdf8"
              strokeWidth={2.5}
              dot={{ r: 3, stroke: "#bae6fd", fill: "#0ea5e9" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell
        title="Recomendación de riego vs condiciones meteorológicas"
        subtitle="7 días · barras meteorológicas y línea temperatura · recomendación diaria"
        empty={weeklyMeteoEmpty}
        stackedCharts
      >
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={props.weekly} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid {...GRID_STYLE} vertical={false} />
            <XAxis dataKey="dayShort" tick={tickStyle} tickLine={false} axisLine={false} />
            <YAxis yAxisId="pct" orientation="left" width={42} domain={[0, 100]} tick={tickStyle} tickLine={false} axisLine={false} />
            <YAxis yAxisId="temp" orientation="right" width={38} domain={["auto", "auto"]} tick={tickStyle} tickLine={false} axisLine={false} />
            <Tooltip
              content={(t) => {
                const row = (t.payload?.[0] as { payload: DailyMeteoRecoRow })?.payload;
                if (!row) return null;
                return (
                  <div className="rounded-lg border border-slate-600/60 bg-[#0f1a2a] px-2.5 py-2 text-[10px] shadow-xl shadow-black/35">
                    <p className="text-slate-400">{row.dayShort}</p>
                    <p className="mt-1 text-sky-300">Lluvia max. {row.lluviaPct}%</p>
                    <p className="text-orange-300">Temp. media · {row.tempMedia} °C</p>
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar yAxisId="pct" dataKey="lluviaPct" name="Lluvia max. (%)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            <Line yAxisId="temp" type="monotone" dataKey="tempMedia" name="Temp. media (°C)" stroke="#fb923c" strokeWidth={2} dot={{ r: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>

        <div className="-mx-0.5 sm:mx-0">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Índice de recomendación por día (1–4)
          </p>
          <ResponsiveContainer width="100%" height={226}>
            <BarChart data={props.weekly} margin={{ top: 10, right: 10, left: 2, bottom: 36 }}>
              <CartesianGrid {...GRID_STYLE} vertical={false} />
              <XAxis
                dataKey="dayShort"
                interval={0}
                height={54}
                tickMargin={14}
                tick={<DailyIndexXAxisTick />}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 4]}
                ticks={[1, 2, 3, 4]}
                interval={0}
                width={118}
                tick={<DailyIndexYAxisTick />}
                tickLine={false}
                axisLine={false}
                tickMargin={6}
              />
              <Tooltip content={<DailyIndexBarTooltip />} />
              <Bar dataKey="recNivel" name="Recomendación" fill="#34d399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartShell>

      <ChartShell
        title="Tendencia de humedad de suelo"
        subtitle={soilTrendSubtitleParts[props.evolutionRangeKey]}
        empty={soilEmpty}
        emptyMessage={props.soilTrendEmptyMessage}
        belowChart={soilTrendBelowChart}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={props.soilTrend} margin={{ top: 6, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid {...GRID_STYLE} vertical={false} />
            <XAxis dataKey="dateLabel" tick={tickStyle} tickLine={false} axisLine={false} interval={props.evolutionRangeKey === "30d" ? 2 : props.evolutionRangeKey === "7d" ? 0 : "preserveStartEnd"} minTickGap={16} />
            <YAxis width={42} domain={["auto", "auto"]} tick={tickStyle} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              formatter={(value: number) => [`${value}%`, "Humedad suelo media"]}
              labelFormatter={(l) => `Momento · ${l}`}
              contentStyle={{
                borderRadius: 8,
                background: "#0f1a2a",
                border: "1px solid rgba(100,116,139,0.5)",
                fontSize: "10px",
                padding: "8px"
              }}
            />
            <Line type="monotone" dataKey="valor" name="% suelo" stroke="#22c55e" strokeWidth={2.2} dot={{ r: 2 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartShell>
    </div>
  );
}
