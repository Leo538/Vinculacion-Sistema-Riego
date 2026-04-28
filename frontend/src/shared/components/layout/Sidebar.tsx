"use client";

import { Activity, Bell, LayoutDashboard, Sprout, Waves } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardScrollArea } from "@/shared/components/ui/DashboardScrollArea";
import { IconBox } from "@/shared/components/ui/IconBox";
import { useTheme } from "@/shared/theme/ThemeProvider";

const sidebarItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    isActive: (p: string) => p === "/dashboard" || p === "/"
  },
  {
    label: "Sensores",
    icon: Activity,
    href: "/sensores",
    isActive: (p: string) => p === "/sensores"
  },
  {
    label: "Riego",
    icon: Sprout,
    href: "/riego",
    isActive: (p: string) => p === "/riego"
  },
  {
    label: "Alertas",
    icon: Bell,
    href: "/alertas",
    isActive: (p: string) => p === "/alertas"
  }
] as const;

export function Sidebar() {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname() ?? "/";

  return (
    <aside
      className={`flex h-full min-h-0 w-full flex-col border-b p-3 lg:w-56 lg:min-w-[224px] lg:border-b-0 lg:border-r ${
        theme === "light" ? "border-sky-900/10 bg-[#e8f1ff]" : "border-slate-700/40 bg-[#070f18]"
      }`}
    >
      <div className="mb-3 flex items-center gap-2.5">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
          <IconBox icon={Waves} className="size-9" iconSizeClassName="size-4" rounded="full" />
          <div className="min-w-0">
            <p className="truncate text-[10px] font-medium uppercase tracking-wider text-slate-500">IOT</p>
            <p className={`truncate text-sm font-semibold ${theme === "light" ? "text-slate-800" : "text-white"}`}>Riego Inteligente</p>
          </div>
        </Link>
      </div>

      <DashboardScrollArea as="nav" className="flex flex-col gap-1">
        {sidebarItems.map((item) => {
          const active = item.isActive(pathname);
          const className = `flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left text-xs font-medium transition ${
            active
              ? theme === "light"
                ? "bg-blue-500/15 text-slate-900 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.35)]"
                : "bg-blue-500/15 text-white shadow-[inset_0_0_0_1px_rgba(59,130,246,0.35)]"
              : theme === "light"
                ? "text-slate-600 hover:bg-sky-700/10 hover:text-slate-800"
                : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
          }`;

          return (
            <Link key={item.label} href={item.href} className={className}>
              <IconBox
                icon={item.icon}
                className="size-8"
                iconSizeClassName="size-3.5"
                rounded="full"
                variant={active ? "cyan" : "muted"}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </DashboardScrollArea>

      <div
        className={`mt-auto shrink-0 rounded-xl border p-1 ${
          theme === "light" ? "border-sky-900/10 bg-white/80" : "border-slate-700/40 bg-[#0f1b2d]"
        }`}
      >
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
    </aside>
  );
}
