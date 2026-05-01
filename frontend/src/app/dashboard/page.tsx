import { DashboardPageView } from "@/modules/dashboard/components/DashboardPageView";
import { getOpenMeteoClimateOnly } from "@/modules/dashboard/data/openMeteoClimate";

export default async function DashboardPage() {
  const climate = await getOpenMeteoClimateOnly();
  return <DashboardPageView climate={climate} />;
}
