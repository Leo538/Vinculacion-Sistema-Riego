import { IrrigationRecommendation } from "@/modules/dashboard/components/IrrigationRecommendation";
import type { DashboardData } from "@/modules/dashboard/types";
import { TelemetryPageLayout } from "@/shared/components/layout/TelemetryPageLayout";

export function RiegoPageView({ dashboardData }: { dashboardData: DashboardData }) {
  return (
    <TelemetryPageLayout
      title="Riego"
      subtitle="Recomendaciones y programación del sistema de riego"
      note="Vista dedicada a riego. Los datos siguen siendo de demostración / Open-Meteo hasta conectar el backend."
    >
      <div className="grid shrink-0 gap-3">
        <IrrigationRecommendation irrigation={dashboardData.irrigation} />
      </div>
    </TelemetryPageLayout>
  );
}
