import { AlertasPageView } from "@/modules/alertas/components/AlertasPageView";
import { getOpenMeteoDashboardData } from "@/modules/dashboard/data/openMeteoDashboardData";

export default async function AlertasPage() {
  const dashboardData = await getOpenMeteoDashboardData();
  return <AlertasPageView dashboardData={dashboardData} />;
}
