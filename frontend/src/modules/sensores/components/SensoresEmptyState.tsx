import { sensorIconMap } from "@/modules/sensores/components/sensorIconMap";
import type { SensorIconKey } from "@/modules/sensores/types";
import { Card } from "@/shared/components/ui/Card";
import { IconBox } from "@/shared/components/ui/IconBox";

interface SensoresEmptyStateProps {
  /** Contenido principal (mensaje corto). */
  title: string;
  /** Línea secundaria más discreta. */
  hint?: string;
  iconKey?: SensorIconKey;
  /** Centrado y compacto (p. ej. bloque superior sin lecturas). */
  variant?: "banner" | "row";
  className?: string;
}

export function SensoresEmptyState({
  title,
  hint,
  iconKey = "activity",
  variant = "row",
  className = ""
}: SensoresEmptyStateProps) {
  const Icon = sensorIconMap[iconKey];

  if (variant === "banner") {
    return (
      <Card padding="sm" className={`col-span-full border-dashed ${className}`}>
        <div className="flex flex-col items-center justify-center gap-2 py-4 text-center md:py-5">
          <IconBox icon={Icon} className="size-10" iconSizeClassName="size-4" rounded="full" aria-hidden />
          <div className="max-w-md space-y-1">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{title}</p>
            {hint ? <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">{hint}</p> : null}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="sm" className={`flex items-start gap-3 border-dashed ${className}`}>
      <IconBox icon={Icon} className="size-9 shrink-0" iconSizeClassName="size-3.5" rounded="full" aria-hidden />
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{title}</p>
        {hint ? <p className="mt-1 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">{hint}</p> : null}
      </div>
    </Card>
  );
}
