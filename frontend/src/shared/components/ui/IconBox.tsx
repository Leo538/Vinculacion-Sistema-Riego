import type { LucideIcon } from "lucide-react";

export type IconBoxVariant = "cyan" | "amber" | "emerald" | "muted";

const variantStyles: Record<
  IconBoxVariant,
  { box: string; icon: string }
> = {
  cyan: {
    box: "border-blue-500/35 bg-[#0c1f33] shadow-[0_0_18px_rgba(59,130,246,0.45),0_0_6px_rgba(56,189,248,0.2)]",
    icon: "text-sky-300"
  },
  amber: {
    box: "border-amber-400/35 bg-[#2a1f0c] shadow-[0_0_20px_rgba(234,179,8,0.35)]",
    icon: "text-amber-300"
  },
  emerald: {
    box: "border-emerald-500/35 bg-[#0c2218] shadow-[0_0_16px_rgba(34,197,94,0.35)]",
    icon: "text-emerald-300"
  },
  muted: {
    box: "border-slate-600/40 bg-[#0f1a2a] shadow-[0_0_12px_rgba(148,163,184,0.15)]",
    icon: "text-slate-400"
  }
};

interface IconBoxProps {
  icon: LucideIcon;
  className?: string;
  iconClassName?: string;
  iconSizeClassName?: string;
  variant?: IconBoxVariant;
  /** Si true, contenedor circular (estilo referencia) */
  rounded?: "lg" | "full";
}

export function IconBox({
  icon: Icon,
  className = "",
  iconClassName,
  iconSizeClassName = "size-3.5",
  variant = "cyan",
  rounded = "full"
}: IconBoxProps) {
  const v = variantStyles[variant];
  const roundClass = rounded === "full" ? "rounded-full" : "rounded-lg";

  return (
    <span
      className={`grid size-8 shrink-0 place-items-center border ${roundClass} ${v.box} ${className}`}
      aria-hidden
    >
      <Icon className={`${iconSizeClassName} ${iconClassName ?? v.icon}`} strokeWidth={1.35} />
    </span>
  );
}
