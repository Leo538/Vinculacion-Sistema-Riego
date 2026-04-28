import type { ElementType, HTMLAttributes, ReactNode } from "react";

type ScrollAs = "div" | "ul" | "ol" | "nav" | "section";

export interface DashboardScrollAreaProps extends Omit<HTMLAttributes<HTMLElement>, "className"> {
  /** Contenedor del scroll (lista o bloque). */
  as?: ScrollAs;
  className?: string;
  children: ReactNode;
}

/**
 * Área con scroll vertical y barra personalizada (track oscuro, thumb gris en píldora),
 * reutilizable en Sensores, Alertas, sidebar, etc.
 */
export function DashboardScrollArea({
  as,
  className = "",
  children,
  ...rest
}: DashboardScrollAreaProps) {
  const Component = (as ?? "div") as ElementType;
  return (
    <Component
      className={`dashboard-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1 ${className}`.trim()}
      {...rest}
    >
      {children}
    </Component>
  );
}
