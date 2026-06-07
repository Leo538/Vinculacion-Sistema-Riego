"use client";

import { Activity, Bell, Cpu, LayoutDashboard, Sprout } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardScrollArea } from "@/shared/components/ui/DashboardScrollArea";
import { IconBox } from "@/shared/components/ui/IconBox";

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
  },
  {
    label: "Dispositivos",
    icon: Cpu,
    href: "/dispositivos",
    isActive: (p: string) => p === "/dispositivos"
  }
] as const;

export function SidebarNav() {
  const pathname = usePathname() ?? "/";

  return (
    <DashboardScrollArea as="nav" className="flex flex-col gap-1">
      {sidebarItems.map((item) => {
        const active = item.isActive(pathname);
        const className = `flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left text-xs font-medium transition ${
          active
            ? "bg-blue-500/15 text-slate-900 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.35)] dark:text-white"
            : "text-slate-600 hover:bg-sky-700/10 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/[0.04] dark:hover:text-slate-200"
        }`;

        return (
          <Link key={item.label} href={item.href} className={className}>
            <IconBox icon={item.icon} className="size-8" iconSizeClassName="size-3.5" rounded="full" variant={active ? "cyan" : "muted"} />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </DashboardScrollArea>
  );
}
