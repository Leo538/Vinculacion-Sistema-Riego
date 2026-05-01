"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/shared/components/layout/AppShell";
import { LivePageHeader } from "@/shared/components/ui/LivePageHeader";
import { Card } from "@/shared/components/ui/Card";

interface TelemetryPageLayoutProps {
  title: string;
  subtitle: string;
  note: string;
  /** Ej. selector de dispositivo (IoT). */
  headerTrailing?: ReactNode;
  children: ReactNode;
}

export function TelemetryPageLayout({ title, subtitle, note, headerTrailing, children }: TelemetryPageLayoutProps) {
  return (
    <AppShell mainClassName="overflow-y-auto overflow-x-hidden">
      <LivePageHeader title={title} subtitle={subtitle} trailing={headerTrailing} />

      <div className="grid max-w-3xl shrink-0 gap-3">
        {children}
        <Card padding="sm" className="text-[11px] text-slate-400">
          <p className="font-medium text-slate-800 dark:text-slate-200">Nota</p>
          <p className="mt-1 leading-relaxed">{note}</p>
        </Card>
      </div>
    </AppShell>
  );
}
