import { RiegoPageView } from "@/modules/riego/components/RiegoPageView";
import { getOpenMeteoClimateOnly } from "@/modules/dashboard/data/openMeteoClimate";

export default async function RiegoPage() {
  const climate = await getOpenMeteoClimateOnly();
  return <RiegoPageView climate={climate} />;
}
