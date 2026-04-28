"use client";

import {
  Activity,
  BarChart3,
  Bell,
  CloudSun,
  Home,
  Settings,
  Sprout,
  Waves
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBox } from "@/components/ui/IconBox";
import { DashboardScrollArea } from "@/components/ui/DashboardScrollArea";

const sidebarItems = [
  { type: "link" as const, label: "Resumen", icon: Home, href: "/", isActive: (p: string) => p === "/" },
  { type: "link" as const, label: "Clima", icon: CloudSun, href: "/", isActive: () => false },
  {
    type: "link" as const,
    label: "Sensores",
    icon: Activity,
    href: "/sensores",
    isActive: (p: string) => p === "/sensores"
  },
  { type: "button" as const, label: "Riego", icon: Sprout },
  { type: "button" as const, label: "Gráficas", icon: BarChart3 },
  { type: "button" as const, label: "Alertas", icon: Bell },
  { type: "button" as const, label: "Configuración", icon: Settings }
] as const;

interface SidebarProps {
  theme: "dark" | "light";
  onThemeChange: (theme: "dark" | "light") => void;
}

export function Sidebar({ theme, onThemeChange }: SidebarProps) {
  const pathname = usePathname() ?? "/";

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-b border-slate-700/40 bg-[#070f18] p-3 lg:w-56 lg:min-w-[224px] lg:border-b-0 lg:border-r">
      <div className="mb-3 flex items-center gap-2.5">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <IconBox icon={Waves} className="size-9" iconSizeClassName="size-4" rounded="full" />
          <div className="min-w-0">
            <p className="truncate text-[10px] font-medium uppercase tracking-wider text-slate-500">IOT</p>
            <p className="truncate text-sm font-semibold text-white">Smart Irrigation</p>
          </div>
        </Link>
      </div>

      <DashboardScrollArea as="nav" className="flex flex-col gap-1">
        {sidebarItems.map((item) => {
          const active = item.type === "link" && item.isActive(pathname);
          const className = `flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left text-xs font-medium transition ${
            active
              ? "bg-blue-500/15 text-white shadow-[inset_0_0_0_1px_rgba(59,130,246,0.35)]"
              : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
          }`;

          if (item.type === "button") {
            return (
              <button key={item.label} type="button" className={className}>
                <IconBox
                  icon={item.icon}
                  className="size-8"
                  iconSizeClassName="size-3.5"
                  rounded="full"
                  variant="muted"
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          }

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

      <div className="mt-auto shrink-0 rounded-xl border border-slate-700/40 bg-[#0f1b2d] p-1">
        <div className="grid grid-cols-2 gap-0.5 text-[11px] font-medium">
          <button
            type="button"
            onClick={() => onThemeChange("light")}
            className={`rounded-lg px-2 py-1.5 transition ${
              theme === "light" ? "bg-blue-500/20 text-sky-300 shadow-[0_0_12px_rgba(59,130,246,0.25)]" : "text-slate-400 hover:bg-white/5"
            }`}
          >
            Claro
          </button>
          <button
            type="button"
            onClick={() => onThemeChange("dark")}
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
