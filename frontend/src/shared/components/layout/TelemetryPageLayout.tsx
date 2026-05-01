"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/shared/components/layout/AppShell";
import { LivePageHeader } from "@/shared/components/ui/LivePageHeader";
import { Card } from "@/shared/components/ui/Card";

interface TelemetryPageLayoutProps {
  title: string;
  subtitle: string;
  /** Pie explicativo opcional al final de la página */
  note?: string;
  /** Ej. selector de dispositivo (IoT). */
  headerTrailing?: ReactNode;
  /** Contenedor principal más ancho (gráficas, /riego). */
  wideContent?: boolean;
  children: ReactNode;
}

export function TelemetryPageLayout({
  title,
  subtitle,
  note,
  headerTrailing,
  wideContent,
  children
}: TelemetryPageLayoutProps) {
  return (
    <AppShell mainClassName="overflow-y-auto overflow-x-hidden">
      <LivePageHeader title={title} subtitle={subtitle} trailing={headerTrailing} />

      <div
        className={
          wideContent
            ? "mx-auto grid w-full max-w-7xl shrink-0 gap-5 px-0 sm:px-1 pb-8"
            : "grid max-w-3xl shrink-0 gap-3"
        }
      >
        {children}
        {note ? (
          <Card padding="sm" className="text-[11px] text-slate-400">
            <p className="font-medium text-slate-800 dark:text-slate-200">Nota</p>
            <p className="mt-1 leading-relaxed">{note}</p>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
