import { Waves } from "lucide-react";
import Link from "next/link";
import { SidebarNav } from "@/shared/components/layout/SidebarNav";
import { SidebarThemeToggle } from "@/shared/components/layout/SidebarThemeToggle";
import { IconBox } from "@/shared/components/ui/IconBox";

export function Sidebar() {
  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-b border-sky-900/10 bg-[#e8f1ff] p-3 dark:border-slate-700/40 dark:bg-[#070f18] lg:w-56 lg:min-w-[224px] lg:border-b-0 lg:border-r">
      <div className="mb-3 flex items-center gap-2.5">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
          <IconBox icon={Waves} className="size-9" iconSizeClassName="size-4" rounded="full" />
          <div className="min-w-0">
            <p className="truncate text-[10px] font-medium uppercase tracking-wider text-slate-500">IOT</p>
            <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">Riego Inteligente</p>
          </div>
        </Link>
      </div>

      <SidebarNav />
      <SidebarThemeToggle />
    </aside>
  );
}
