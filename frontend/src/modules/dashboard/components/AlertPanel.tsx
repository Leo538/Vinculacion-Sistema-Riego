import Link from "next/link";
import { Bell } from "lucide-react";
import type { AlertItem } from "@/modules/dashboard/types";
import { Card } from "@/shared/components/ui/Card";
import { DashboardScrollArea } from "@/shared/components/ui/DashboardScrollArea";
import { IconBox } from "@/shared/components/ui/IconBox";

const MAX_EMBEDDED = 3;

const severityDotClass: Record<AlertItem["severity"], string> = {
  alta: "bg-danger",
  media: "bg-warning",
  baja: "bg-info"
};

export type AlertPanelVariant = "embedded" | "page";

export function AlertPanel({
  alerts,
  variant = "embedded"
}: {
  alerts: AlertItem[];
  variant?: AlertPanelVariant;
}) {
  const visible =
    variant === "embedded" ? alerts.slice(0, MAX_EMBEDDED) : alerts.slice();

  const emptyMessage =
    "No hay alertas activas según las lecturas actuales.";
  const isEmbedded = variant === "embedded";

  return (
    <Card className="flex min-h-0 flex-1 flex-col overflow-hidden" padding="sm">
      <div className="mb-2 flex shrink-0 items-center gap-2">
        <IconBox icon={Bell} className="size-7" iconSizeClassName="size-3" variant="amber" rounded="full" />
        <h2 className="text-[10px] font-bold uppercase tracking-wide text-white">Alertas</h2>
      </div>
      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-600/50 bg-slate-900/30 px-2 py-3 text-[10px] leading-snug text-slate-500 dark:text-slate-500">
          {emptyMessage}
        </p>
      ) : null}
      <DashboardScrollArea as="ul" className="space-y-1.5">
        {visible.map((alert) => (
          <li
            key={alert.id}
            className="rounded-xl border border-[#CBDDF5] bg-[#EEF5FF] px-2 py-1.5 transition hover:border-sky-300/70 dark:border-slate-700/40 dark:bg-[#0f1b2d] dark:hover:border-slate-600/50"
          >
            <p className="flex items-start gap-1.5 text-[10px] font-semibold text-slate-900 dark:text-slate-100">
              <span
                className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full shadow-[0_0_6px_currentColor] ${severityDotClass[alert.severity]}`}
              />
              {alert.title}
            </p>
            <p className="ml-2 line-clamp-3 text-[9px] text-slate-500 dark:text-slate-500">{alert.detail}</p>
          </li>
        ))}
      </DashboardScrollArea>
      {isEmbedded ? (
        <Link
          href="/alertas"
          className="mt-2 shrink-0 text-left text-[10px] font-medium text-sky-400 transition hover:text-sky-300 hover:drop-shadow-[0_0_6px_rgba(56,189,248,0.4)]"
        >
          Ver todas las alertas
        </Link>
      ) : null}
    </Card>
  );
}
