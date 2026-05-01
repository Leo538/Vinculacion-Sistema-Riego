import type { ReactNode } from "react";
import { LivePageHeader } from "@/shared/components/ui/LivePageHeader";

export function SensorsPageHeader({ trailing }: { trailing?: ReactNode }) {
  return (
    <LivePageHeader
      title="Sensores"
      subtitle="Lecturas IoT (backend) y clima de referencia (Open-Meteo)"
      trailing={trailing}
    />
  );
}
