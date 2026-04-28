import { DashboardPageView } from "@/modules/dashboard/components/DashboardPageView";
import { getOpenMeteoDashboardData } from "@/modules/dashboard/data/openMeteoDashboardData";

export default async function DashboardPage() {
  const dashboardData = await getOpenMeteoDashboardData();
  return <DashboardPageView dashboardData={dashboardData} />;
}
