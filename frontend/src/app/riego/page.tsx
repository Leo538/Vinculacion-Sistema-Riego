import { RiegoPageView } from "@/modules/riego/components/RiegoPageView";
import { getOpenMeteoDashboardData } from "@/modules/dashboard/data/openMeteoDashboardData";

export default async function RiegoPage() {
  const dashboardData = await getOpenMeteoDashboardData();
  return <RiegoPageView dashboardData={dashboardData} />;
}
