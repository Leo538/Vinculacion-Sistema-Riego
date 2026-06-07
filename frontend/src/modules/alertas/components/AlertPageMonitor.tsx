"use client";

import {
  AlertTriangle,
  CircleAlert,
  CloudRain,
  Droplets,
  Gauge,
  Info,
  Sprout,
  type LucideIcon
} from "lucide-react";
import type { AlertPageSlot, AlertPageSlotId } from "@/modules/alertas/lib/buildAlertPageSlots";
import {
  ALERT_AMBIENT_RH_CRITICAL_OPEN_METEO,
  ALERT_PRESSURE_LOW_HPA_OPEN_METEO,
  ALERT_RAIN_PROB_CRITICAL_OPEN_METEO,
  ALERT_SOIL_MOIST_LOW_IOT
} from "@/modules/alertas/lib/buildAlertPageSlots";
import { Card } from "@/shared/components/ui/Card";

function categoryIcon(id: AlertPageSlotId): LucideIcon {
  switch (id) {
    case "ambient_rh_openmeteo":
      return Droplets;
    case "soil_moisture_iot":
      return Sprout;
    case "rain_probability_openmeteo":
      return CloudRain;
    case "pressure_openmeteo":
      return Gauge;
    default:
      return CircleAlert;
  }
}

function ActiveStatusIcon() {
  return (
    <span
      className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/12 text-amber-600 shadow-sm shadow-amber-900/[0.06] ring-1 ring-amber-500/30 dark:bg-amber-500/[0.12] dark:text-amber-400 dark:shadow-amber-950/40 dark:ring-amber-400/25"
      title="Alerta activa"
    >
      <CircleAlert className="size-[1.1rem]" strokeWidth={2.25} aria-hidden />
    </span>
  );
}

function InactiveStatusIcon() {
  return (
    <span
      className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 ring-1 ring-slate-200/95 dark:bg-slate-800/55 dark:text-slate-500 dark:ring-slate-600/60"
      title="Condición sin alerta"
    >
      <Info className="size-[1.05rem]" strokeWidth={2} aria-hidden />
    </span>
  );
}

export function AlertPageMonitor({ slots }: { slots: AlertPageSlot[] }) {
  const activeCount = slots.filter((s) => s.active).length;

  const renderCategoryGlyph = (id: AlertPageSlotId, active: boolean) => {
    const Ico = categoryIcon(id);
    return (
      <Ico
        className={`size-4 shrink-0 ${active ? "text-amber-600 dark:text-amber-400/90" : "text-slate-400 dark:text-slate-500"}`}
        strokeWidth={2}
        aria-hidden
      />
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          Estado monitorizado
        </h2>
        {activeCount > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/35 bg-amber-500/[0.08] px-2 py-0.5 text-[10px] font-semibold text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/[0.1] dark:text-amber-200/95">
            <AlertTriangle className="size-3 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
            {activeCount} activa{activeCount === 1 ? "" : "s"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100/95 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:border-slate-600/65 dark:bg-slate-800/45 dark:text-slate-400">
            <Info className="size-3 shrink-0 opacity-70" aria-hidden />
            Ningún umbral superado
          </span>
        )}
      </div>
      <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
        Umbrales: HR exterior &gt; {ALERT_AMBIENT_RH_CRITICAL_OPEN_METEO}% (Open‑Meteo); humedad suelo &lt; {ALERT_SOIL_MOIST_LOW_IOT}% (IoT ≤24&nbsp;h);
        lluvia &gt; {ALERT_RAIN_PROB_CRITICAL_OPEN_METEO}%; presión &lt; {ALERT_PRESSURE_LOW_HPA_OPEN_METEO}&nbsp;hPa.
      </p>
      <ul className="space-y-3">
        {slots.map((slot) => (
          <li key={slot.id}>
            <Card
              padding="sm"
              className={
                slot.active
                  ? "relative overflow-hidden border border-slate-200/90 border-l-[3px] border-l-amber-500 bg-white shadow-sm shadow-slate-900/5 ring-1 ring-slate-900/[0.035] dark:border-slate-700/85 dark:border-l-amber-400 dark:bg-slate-950/55 dark:shadow-black/20 dark:ring-white/[0.04]"
                  : "border border-slate-200/75 bg-slate-50/70 shadow-sm shadow-slate-900/5 dark:border-slate-700/60 dark:bg-slate-950/40 dark:shadow-none"
              }
            >
              <div className="relative flex gap-3">
                {slot.active ? <ActiveStatusIcon /> : <InactiveStatusIcon />}
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-start gap-x-2 gap-y-1.5">
                    {renderCategoryGlyph(slot.id, slot.active)}
                    <p className="min-w-0 flex-1 text-[12.5px] font-semibold leading-snug tracking-tight text-slate-900 dark:text-slate-50">
                      {slot.headline}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={
                          slot.active
                            ? "rounded-md border border-amber-400/35 bg-amber-500/[0.09] px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-amber-900 dark:border-amber-500/35 dark:bg-amber-500/12 dark:text-amber-100"
                            : "rounded-md border border-slate-200/90 bg-white px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-600/65 dark:bg-slate-900/55 dark:text-slate-400"
                        }
                      >
                        {slot.active ? "Activa" : "Inactiva"}
                      </span>
                      <span className="text-[9px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                        Fuente · {slot.sourceTag}
                      </span>
                    </div>
                  </div>

                  <p
                    className={`text-[10px] font-medium leading-relaxed ${slot.active ? "text-slate-700 dark:text-slate-300/95" : "text-slate-600 dark:text-slate-400"}`}
                  >
                    {slot.valueLine}
                  </p>

                  <div
                    className={
                      slot.active ?
                        `
                        rounded-lg border border-slate-200/90 bg-slate-50/90 px-2.5 py-2
                        dark:border-slate-700/70 dark:bg-slate-950/45
                        ring-1 ring-inset ring-amber-500/[0.05] dark:ring-amber-400/[0.06]
                      `
                      : `
                        rounded-lg border border-slate-200/80 bg-white/[0.8] px-2.5 py-2 dark:border-slate-700/60 dark:bg-slate-900/35
                      `
                    }
                  >
                    <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-500">
                      Recomendación
                    </p>
                    <p className={`mt-1 text-[10px] font-medium leading-relaxed ${slot.active ? "text-slate-800 dark:text-slate-200/95" : "text-slate-700 dark:text-slate-300"}`}>
                      {slot.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
