import type { SoilHumidityPoint } from "@/modules/dashboard/types";
import { Card } from "@/shared/components/ui/Card";

interface ChartPanelProps {
  title: string;
  subtitle?: string;
  data: SoilHumidityPoint[];
}

export function ChartPanel({ title, subtitle, data }: ChartPanelProps) {
  if (data.length === 0) {
    return null;
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

  const pathD = linePoints
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");

  const yTicks = [0, 0.5, 1].map((t) => Math.round(minV + t * range));
  const labelStep = data.length <= 8 ? 1 : Math.max(1, Math.round(data.length / 5));

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((t) => {
    const gy = padY + t * innerH;
    return <line key={t} x1={padX} y1={gy} x2={w - padX} y2={gy} stroke="rgba(148,163,184,0.08)" strokeWidth={0.35} />;
  });

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden" padding="sm">
      <div className="mb-2 shrink-0">
        <h2 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
        {subtitle ? <p className="truncate text-[10px] text-slate-600">{subtitle}</p> : null}
      </div>

      <div className="flex min-h-0 flex-1 gap-2">
        <div className="flex w-6 shrink-0 flex-col justify-between pb-6 text-[9px] leading-none text-slate-600">
          {[...yTicks].reverse().map((t, idx) => (
            <span key={`${t}-${idx}`}>{t}</span>
          ))}
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <svg
              viewBox={`0 0 ${w} ${h}`}
              className="h-full min-h-[100px] w-full"
              preserveAspectRatio="none"
              aria-hidden
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
            </svg>
          </div>
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
