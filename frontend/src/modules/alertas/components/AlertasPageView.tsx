import { AlertPanel } from "@/modules/dashboard/components/AlertPanel";
import type { DashboardData } from "@/modules/dashboard/types";
import { TelemetryPageLayout } from "@/shared/components/layout/TelemetryPageLayout";

export function AlertasPageView({ dashboardData }: { dashboardData: DashboardData }) {
  return (
    <TelemetryPageLayout
      title="Alertas"
      subtitle="Historial y avisos del sistema de monitoreo"
      note="Las alertas se cargan con los mismos datos que el dashboard (mock / Open-Meteo) hasta integrar API real."
    >
      <div className="grid min-h-0 shrink-0 gap-3">
        <AlertPanel alerts={dashboardData.alerts} />
      </div>
    </TelemetryPageLayout>
  );
}
