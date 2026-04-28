"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Sidebar } from "@/shared/components/layout/Sidebar";

interface AppShellProps {
  children: ReactNode;
  /** Clases extra para `<main>` (p. ej. scroll en páginas largas) */
  mainClassName?: string;
}

export function AppShell({ children, mainClassName = "" }: AppShellProps) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("dashboard-theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("dashboard-theme", theme);
  }, [theme]);

  return (
    <div className="dashboard-shell h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-[#0B1522] text-slate-100">
      <div className="grid h-full min-h-0 w-full grid-rows-[auto_minmax(0,1fr)] overflow-hidden lg:grid-cols-[224px_minmax(0,1fr)] lg:grid-rows-1">
        <Sidebar theme={theme} onThemeChange={setTheme} />
        <main
          className={`flex min-h-0 flex-1 flex-col gap-3 border-t border-slate-700/40 p-3 sm:p-4 lg:border-l lg:border-t-0 ${mainClassName}`.trim()}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
