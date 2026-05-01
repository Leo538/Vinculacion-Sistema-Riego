import { AlertPanel } from "@/modules/dashboard/components/AlertPanel";
import type { DashboardData } from "@/modules/dashboard/types";
import { TelemetryPageLayout } from "@/shared/components/layout/TelemetryPageLayout";

export function AlertasPageView({ dashboardData }: { dashboardData: DashboardData }) {
  return (
    <TelemetryPageLayout
      title="Alertas"
      subtitle="Historial y avisos del sistema de monitoreo"
      note="Las alertas dependen de un API que el backend aún no expone; esta vista no muestra alertas inventadas."
    >
      <div className="grid min-h-0 shrink-0 gap-3">
        <AlertPanel alerts={dashboardData.alerts} />
      </div>
    </TelemetryPageLayout>
  );
}
