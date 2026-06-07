"use client";

import { useMemo, useState } from "react";
import type { SoilHumidityPoint } from "@/modules/dashboard/types";
import { MIN_IOT_CHART_POINTS } from "@/modules/dashboard/lib/iotPresentation";
import { Card } from "@/shared/components/ui/Card";
import { formatChartTooltipMetricLabel, formatChartTooltipUnit } from "@/shared/lib/sensorDisplay";

interface ChartPanelProps {
  title: string;
  subtitle?: string;
  data: SoilHumidityPoint[];
  /** Etiqueta del eje / tooltip (ej. humedad, temperatura). */
  valueLabel?: string;
  /** Unidad mostrada en tooltip (ej. %, °C). */
  valueUnit?: string;
}

const CHART_W = 100;
const CHART_H = 44;
const CHART_PAD_X = 3;
const CHART_PAD_Y = 5;

export function ChartPanel({ title, subtitle, data, valueLabel = "Valor", valueUnit = "%" }: ChartPanelProps) {
  const metricLabelEs = formatChartTooltipMetricLabel(valueLabel);
  const unitEs = formatChartTooltipUnit(valueUnit);
  const [hoverIndex, setHoverIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const hasChart = data.length >= MIN_IOT_CHART_POINTS;

  const chartModel = useMemo(() => {
    if (!hasChart) return null;

    const values = data.map((d) => d.value);
    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const range = maxV - minV || 1;
    const innerW = CHART_W - 2 * CHART_PAD_X;
    const innerH = CHART_H - 2 * CHART_PAD_Y;

    const linePoints = data.map((point, i) => {
      const n = data.length;
      const x = CHART_PAD_X + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
      const y = CHART_PAD_Y + innerH - ((point.value - minV) / range) * innerH;
      return { x, y, label: point.hour, value: point.value, i };
    });

    const pathD = linePoints
      .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
      .join(" ");

    const yTicks = [0, 0.5, 1].map((t) => Math.round(minV + t * range));
    const labelStep = data.length <= 8 ? 1 : Math.max(1, Math.round(data.length / 5));
    const gridLines = [0, 0.25, 0.5, 0.75, 1].map((t) => {
      const gy = CHART_PAD_Y + t * innerH;
      return (
        <line
          key={t}
          x1={CHART_PAD_X}
          y1={gy}
          x2={CHART_W - CHART_PAD_X}
          y2={gy}
          stroke="rgba(148,163,184,0.08)"
          strokeWidth={0.35}
        />
      );
    });

    return { linePoints, pathD, yTicks, labelStep, gridLines, innerW, innerH };
  }, [data, hasChart]);

  const safeHoverIndex = chartModel
    ? Math.min(Math.max(hoverIndex, 0), chartModel.linePoints.length - 1)
    : 0;
  const hoveredPoint =
    chartModel && isHovering ? chartModel.linePoints[safeHoverIndex] : null;

  const tooltipXPercent = ((hoveredPoint?.x ?? CHART_PAD_X) / CHART_W) * 100;
  const tooltipAlignClass = tooltipXPercent > 66 ? "-translate-x-full" : "";
  const tooltipStyle = useMemo(
    () => ({ left: `clamp(0%, ${tooltipXPercent}%, 100%)` }),
    [tooltipXPercent]
  );

  if (!chartModel) {
    return (
      <Card className="flex h-full min-h-[8rem] flex-col justify-center overflow-hidden" padding="sm">
        <div className="mb-1 shrink-0">
          <h2 className="text-[10px] font-bold uppercase tracking-wide text-white">{title}</h2>
          {subtitle ? <p className="truncate text-[10px] text-slate-600">{subtitle}</p> : null}
        </div>
        <p className="text-center text-[10px] text-slate-500">Sin datos históricos en el rango seleccionado.</p>
      </Card>
    );
  }

  const { linePoints, pathD, yTicks, labelStep, gridLines, innerW, innerH } = chartModel;

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden" padding="sm">
      <div className="mb-2 shrink-0">
        <h2 className="text-[10px] font-bold uppercase tracking-wide text-white">{title}</h2>
        {subtitle ? <p className="truncate text-[10px] text-slate-600">{subtitle}</p> : null}
      </div>

      <div className="flex min-h-0 flex-1 gap-2">
        <div className="flex w-6 shrink-0 flex-col justify-between pb-6 text-[9px] leading-none text-slate-600">
          {[...yTicks].reverse().map((t, idx) => (
            <span key={`${t}-${idx}`}>{t}</span>
          ))}
        </div>
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <svg
              viewBox={`0 0 ${CHART_W} ${CHART_H}`}
              className="h-full min-h-[100px] w-full"
              preserveAspectRatio="none"
            >
              {gridLines}
              <defs>
                <linearGradient id="soilLineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path
                d={`${pathD} L ${linePoints[linePoints.length - 1]?.x ?? CHART_PAD_X} ${CHART_H - CHART_PAD_Y} L ${linePoints[0]?.x ?? CHART_PAD_X} ${CHART_H - CHART_PAD_Y} Z`}
                fill="url(#soilLineGradient)"
              />
              <path
                d={pathD}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.15"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {linePoints.map((p) => (
                <circle
                  key={`${p.label}-${p.i}`}
                  cx={p.x}
                  cy={p.y}
                  r={1.35}
                  fill="#93c5fd"
                  stroke="#3b82f6"
                  strokeWidth={0.4}
                  className="drop-shadow-[0_0_4px_rgba(56,189,248,0.9)]"
                />
              ))}
              {hoveredPoint ? (
                <>
                  <line
                    x1={hoveredPoint.x}
                    y1={CHART_PAD_Y}
                    x2={hoveredPoint.x}
                    y2={CHART_H - CHART_PAD_Y}
                    stroke="rgba(226,232,240,0.9)"
                    strokeWidth={0.35}
                  />
                  <circle
                    cx={hoveredPoint.x}
                    cy={hoveredPoint.y}
                    r={2}
                    fill="#ffffff"
                    stroke="#38bdf8"
                    strokeWidth={0.8}
                  />
                </>
              ) : null}
              <rect
                x={CHART_PAD_X}
                y={CHART_PAD_Y}
                width={innerW}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setIsHovering(true)}
                onMouseMove={(e) => {
                  const bounds = (e.currentTarget as SVGRectElement).getBoundingClientRect();
                  const relX = Math.min(Math.max(0, e.clientX - bounds.left), bounds.width);
                  const idx = Math.round((relX / bounds.width) * (linePoints.length - 1));
                  setHoverIndex(idx);
                }}
                onMouseLeave={() => setIsHovering(false)}
              />
            </svg>
          </div>
          {hoveredPoint ? (
            <div
              className={`pointer-events-none absolute top-2 z-10 min-w-[115px] rounded-xl border border-slate-600/70 bg-[#0f1a2a]/95 px-2 py-1.5 shadow-lg shadow-black/35 ${tooltipAlignClass}`}
              style={tooltipStyle}
            >
              <p className="text-[11px] font-medium text-slate-300">Hora · {hoveredPoint.label}</p>
              <p className="text-lg font-semibold leading-tight" style={{ color: "#ffffff" }}>
                {hoveredPoint.value}
                {unitEs ? ` ${unitEs}` : ""}
              </p>
              <p className="text-xs font-semibold text-sky-400">{metricLabelEs}</p>
            </div>
          ) : null}
          <div className="mt-1 grid shrink-0" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
            {data.map((point, i) => (
              <span key={`${point.hour}-${i}`} className="text-center text-[8px] leading-none text-slate-600">
                {i % labelStep === 0 || i === data.length - 1 ? point.hour : "\u00a0"}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
