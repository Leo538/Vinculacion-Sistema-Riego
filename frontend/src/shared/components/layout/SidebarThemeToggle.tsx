"use client";

import { useTheme } from "@/shared/theme/ThemeProvider";

export function SidebarThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="mt-auto shrink-0 rounded-xl border border-sky-900/10 bg-white/80 p-1 dark:border-slate-700/40 dark:bg-[#0f1b2d]">
      <div className="grid grid-cols-2 gap-0.5 text-[11px] font-medium">
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={`rounded-lg px-2 py-1.5 transition ${
            theme === "light" ? "bg-blue-500/20 text-sky-300 shadow-[0_0_12px_rgba(59,130,246,0.25)]" : "text-slate-400 hover:bg-white/5"
          }`}
        >
          Claro
        </button>
        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={`rounded-lg px-2 py-1.5 transition ${
            theme === "dark" ? "bg-blue-500/20 text-sky-300 shadow-[0_0_12px_rgba(59,130,246,0.25)]" : "text-slate-400 hover:bg-white/5"
          }`}
        >
          Oscuro
        </button>
      </div>
    </div>
  );
}
