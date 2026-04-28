import { Activity, Droplets, Thermometer, Waves, Wifi } from "lucide-react";
import type { SensorSummaryItem } from "@/types/sensors.types";
import { Card } from "@/components/ui/Card";
import { IconBox } from "@/components/ui/IconBox";

const iconMap = {
  droplets: Droplets,
  thermometer: Thermometer,
  waves: Waves,
  activity: Activity,
  wifi: Wifi
} as const;

export function SensorSummaryCard({ item }: { item: SensorSummaryItem }) {
  const Icon = iconMap[item.iconKey];

  return (
    <Card
      padding="sm"
      className="flex h-full min-h-[5.25rem] flex-col justify-between gap-1 overflow-hidden"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="line-clamp-2 text-[10px] font-medium leading-tight text-slate-400">{item.label}</span>
        <IconBox icon={Icon} className="size-8" iconSizeClassName="size-3.5" rounded="full" />
      </div>
      <p className="truncate text-lg font-semibold leading-tight tracking-tight text-white">{item.value}</p>
      <p className={`truncate text-[10px] font-medium ${item.captionClassName ?? "text-slate-500"}`}>
        {item.caption}
      </p>
    </Card>
  );
}
