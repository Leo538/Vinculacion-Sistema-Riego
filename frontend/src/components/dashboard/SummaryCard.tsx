import { Activity, CloudRain, Droplets, Gauge, Thermometer, Waves } from "lucide-react";
import type { SummaryMetric } from "@/types/dashboard.types";
import { Card } from "@/components/ui/Card";
import { IconBox } from "@/components/ui/IconBox";

const metricIconMap = {
  droplets: Droplets,
  thermometer: Thermometer,
  "cloud-rain": CloudRain,
  waves: Waves,
  power: Gauge,
  gauge: Gauge,
  activity: Activity
} as const;

function statusTone(metric: SummaryMetric): string {
  if (metric.status === "En línea") return "text-emerald-400";
  if (metric.id === "rain" && metric.status === "Baja") return "text-emerald-400";
  if (metric.status === "Baja" || metric.status === "Moderado") return "text-amber-400";
  if (metric.status === "Alta" || metric.status === "Media") return "text-sky-400";
  return "text-slate-500";
}

export function SummaryCard({ metric }: { metric: SummaryMetric }) {
  const Icon = metricIconMap[metric.icon];

  return (
    <Card
      padding="sm"
      className="flex h-full min-h-[5.25rem] flex-col justify-between gap-1 overflow-hidden"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="line-clamp-2 text-[10px] font-medium leading-tight text-slate-400">{metric.label}</span>
        <IconBox icon={Icon} className="size-8" iconSizeClassName="size-3.5" rounded="full" />
      </div>
      <p className="truncate text-lg font-semibold leading-tight tracking-tight text-white">{metric.value}</p>
      <p className={`truncate text-[10px] font-medium ${statusTone(metric)}`}>{metric.status}</p>
    </Card>
  );
}
