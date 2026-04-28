"use client";

import { Sidebar } from "@/shared/components/layout/Sidebar";
import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
  /** Clases extra para `<main>` (p. ej. scroll en páginas largas) */
  mainClassName?: string;
}

export function AppShell({ children, mainClassName = "" }: AppShellProps) {
  return (
    <div className="dashboard-shell h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-[#EEF5FF] text-slate-900 dark:bg-[#0B1522] dark:text-slate-100">
      <div className="grid h-full min-h-0 w-full grid-rows-[auto_minmax(0,1fr)] overflow-hidden lg:grid-cols-[224px_minmax(0,1fr)] lg:grid-rows-1">
        <Sidebar />
        <main
          className={`flex min-h-0 flex-1 flex-col gap-3 border-t border-[#CBDDF5] p-3 sm:p-4 lg:border-l lg:border-t-0 dark:border-slate-700/40 ${mainClassName}`.trim()}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
