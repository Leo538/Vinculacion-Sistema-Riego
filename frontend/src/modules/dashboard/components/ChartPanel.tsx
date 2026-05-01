"use client";

import { useMemo, useState } from "react";
import type { SoilHumidityPoint } from "@/modules/dashboard/types";
import { Card } from "@/shared/components/ui/Card";

interface ChartPanelProps {
  title: string;
  subtitle?: string;
  data: SoilHumidityPoint[];
  /** Etiqueta del eje / tooltip (ej. humedad, temperatura). */
  valueLabel?: string;
  /** Unidad mostrada en tooltip (ej. %, °C). */
  valueUnit?: string;
}

export function ChartPanel({ title, subtitle, data, valueLabel = "Valor", valueUnit = "%" }: ChartPanelProps) {
  if (data.length === 0) {
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

  const values = data.map((d) => d.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;

  const w = 100;
  const h = 44;
  const padX = 3;
  const padY = 5;
  const innerW = w - 2 * padX;
  const innerH = h - 2 * padY;

  const linePoints = data.map((point, i) => {
    const n = data.length;
    const x = padX + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const y = padY + innerH - ((point.value - minV) / range) * innerH;
    return { x, y, label: point.hour, value: point.value, i };
  });
  const [hoverIndex, setHoverIndex] = useState<number>(0);
  const [isHovering, setIsHovering] = useState(false);
  const safeHoverIndex = Math.min(Math.max(hoverIndex, 0), linePoints.length - 1);
  const hoveredPoint = isHovering ? linePoints[safeHoverIndex] : null;

  const pathD = linePoints
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");

  const yTicks = [0, 0.5, 1].map((t) => Math.round(minV + t * range));
  const labelStep = data.length <= 8 ? 1 : Math.max(1, Math.round(data.length / 5));

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((t) => {
    const gy = padY + t * innerH;
    return <line key={t} x1={padX} y1={gy} x2={w - padX} y2={gy} stroke="rgba(148,163,184,0.08)" strokeWidth={0.35} />;
  });
  const tooltipXPercent = ((hoveredPoint?.x ?? padX) / w) * 100;
  const tooltipAlignClass = tooltipXPercent > 66 ? "-translate-x-full" : "";
  const tooltipStyle = useMemo(
    () => ({ left: `clamp(0%, ${tooltipXPercent}%, 100%)` }),
    [tooltipXPercent]
  );

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
              viewBox={`0 0 ${w} ${h}`}
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
                d={`${pathD} L ${linePoints[linePoints.length - 1]?.x ?? padX} ${h - padY} L ${linePoints[0]?.x ?? padX} ${h - padY} Z`}
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
                    y1={padY}
                    x2={hoveredPoint.x}
                    y2={h - padY}
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
                x={padX}
                y={padY}
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
              <p className="text-[11px] font-medium text-slate-300">{hoveredPoint.label}</p>
              <p className="text-lg font-semibold leading-tight" style={{ color: "#ffffff" }}>
                {hoveredPoint.value} {valueUnit}
              </p>
              <p className="text-xs font-semibold text-sky-400">{valueLabel}</p>
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
