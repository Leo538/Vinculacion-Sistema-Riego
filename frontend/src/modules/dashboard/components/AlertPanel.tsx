import { Bell } from "lucide-react";
import type { AlertItem } from "@/modules/dashboard/types";
import { Card } from "@/shared/components/ui/Card";
import { DashboardScrollArea } from "@/shared/components/ui/DashboardScrollArea";
import { IconBox } from "@/shared/components/ui/IconBox";

const MAX_VISIBLE = 3;

const severityDotClass: Record<AlertItem["severity"], string> = {
  alta: "bg-danger",
  media: "bg-warning",
  baja: "bg-info"
};

export function AlertPanel({ alerts }: { alerts: AlertItem[] }) {
  const visible = alerts.slice(0, MAX_VISIBLE);

  return (
    <Card className="flex min-h-0 flex-1 flex-col overflow-hidden" padding="sm">
      <div className="mb-2 flex shrink-0 items-center gap-2">
        <IconBox icon={Bell} className="size-7" iconSizeClassName="size-3" variant="amber" rounded="full" />
        <h2 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Alertas</h2>
      </div>
      <DashboardScrollArea as="ul" className="space-y-1.5">
        {visible.map((alert) => (
          <li
            key={alert.id}
            className="rounded-xl border border-slate-700/40 bg-[#0f1b2d] px-2 py-1.5 transition hover:border-slate-600/50"
          >
            <p className="flex items-start gap-1.5 text-[10px] font-semibold text-slate-100">
              <span
                className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full shadow-[0_0_6px_currentColor] ${severityDotClass[alert.severity]}`}
              />
              {alert.title}
            </p>
            <p className="ml-2 line-clamp-2 text-[9px] text-slate-500">{alert.detail}</p>
          </li>
        ))}
      </DashboardScrollArea>
      <button
        type="button"
        className="mt-2 shrink-0 text-left text-[10px] font-medium text-sky-400 transition hover:text-sky-300 hover:drop-shadow-[0_0_6px_rgba(56,189,248,0.4)]"
      >
        Ver todas las alertas
      </button>
    </Card>
  );
}
