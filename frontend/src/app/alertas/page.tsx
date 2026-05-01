import { AlertasPageView } from "@/modules/alertas/components/AlertasPageView";
import { getOpenMeteoClimateOnly } from "@/modules/dashboard/data/openMeteoClimate";

export default async function AlertasPage() {
  const climate = await getOpenMeteoClimateOnly();
  return <AlertasPageView climate={climate} />;
}
