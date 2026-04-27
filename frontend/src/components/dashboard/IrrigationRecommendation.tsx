import { Clock3, Droplets, Sprout } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { IconBox } from "@/components/ui/IconBox";
import type { IrrigationDecision } from "@/types/dashboard.types";

export function IrrigationRecommendation({ irrigation }: { irrigation: IrrigationDecision }) {
  const isWaterNow = irrigation.action === "Regar ahora";
  const MainIcon = isWaterNow ? Droplets : Sprout;

  return (
    <Card className="flex shrink-0 flex-col overflow-hidden" padding="sm">
      <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        Recomendación de riego
      </h2>
      <div className="flex gap-2.5">
        <IconBox
          icon={MainIcon}
          className="size-10"
          iconSizeClassName="size-4"
          variant={isWaterNow ? "emerald" : "cyan"}
          rounded="full"
        />
        <div className="min-w-0 flex-1">
          <p className={`truncate text-xs font-semibold ${isWaterNow ? "text-emerald-400" : "text-sky-300"}`}>
            {irrigation.action}
          </p>
          <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-slate-400">
            <Clock3 className="size-3 shrink-0 text-slate-500" strokeWidth={1.35} />
            {irrigation.suggestedTime}
          </p>
          <p className="mt-1 line-clamp-2 text-[9px] leading-snug text-slate-500">{irrigation.reason}</p>
        </div>
      </div>
    </Card>
  );
}
