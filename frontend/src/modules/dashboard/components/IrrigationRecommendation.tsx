import { Clock3, CloudOff, CloudRain, Droplets, Sprout } from "lucide-react";
import type { IrrigationDecision } from "@/modules/dashboard/types";
import { Card } from "@/shared/components/ui/Card";
import { IconBox } from "@/shared/components/ui/IconBox";
import type { IconBoxVariant } from "@/shared/components/ui/IconBox";

function styleForDecision(irrigation: IrrigationDecision): {
  MainIcon: typeof Droplets;
  variant: IconBoxVariant;
  titleClass: string;
} {
  const { action } = irrigation;
  if (action === "Regar ahora") {
    return { MainIcon: Droplets, variant: "emerald", titleClass: "text-emerald-400" };
  }
  if (action === "Esperar lluvia") {
    return { MainIcon: CloudRain, variant: "amber", titleClass: "text-amber-300" };
  }
  if (action === "Sin dato de suelo") {
    return { MainIcon: CloudOff, variant: "muted", titleClass: "text-slate-400" };
  }
  return { MainIcon: Sprout, variant: "cyan", titleClass: "text-sky-300" };
}

export function IrrigationRecommendation({ irrigation }: { irrigation: IrrigationDecision }) {
  const { MainIcon, variant, titleClass } = styleForDecision(irrigation);

  return (
    <Card className="flex shrink-0 flex-col overflow-hidden" padding="sm">
      <h2 className="mb-2 text-[10px] font-bold uppercase tracking-wide text-white">
        Recomendación de riego
      </h2>
      <div className="flex gap-2.5">
        <IconBox
          icon={MainIcon}
          className="size-10"
          iconSizeClassName="size-4"
          variant={variant}
          rounded="full"
        />
        <div className="min-w-0 flex-1">
          <p className={`truncate text-xs font-semibold ${titleClass}`}>{irrigation.action}</p>
          <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-slate-400">
            <Clock3 className="size-3 shrink-0 text-slate-500" strokeWidth={1.35} />
            {irrigation.suggestedTime}
          </p>
          <p className="mt-1 line-clamp-3 text-[9px] leading-snug text-slate-500">{irrigation.reason}</p>
        </div>
      </div>
    </Card>
  );
}
