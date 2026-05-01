import type { DashboardData, SummaryMetric } from "@/modules/dashboard/types";
import { OPEN_METEO_UNAVAILABLE, getOpenMeteoClimateOnly } from "@/modules/dashboard/data/openMeteoClimate";
import { buildIrrigationRecommendation } from "@/modules/dashboard/lib/irrigationRecommendation";

/**
 * Dataset para vistas que siguen solo con Open-Meteo (p. ej. Alertas) sin serie IoT.
 * La recomendación de riego aquí coincide con las reglas comunes cuando no hay sensor de suelo.
 */
export async function getOpenMeteoDashboardData(): Promise<DashboardData> {
  const c = await getOpenMeteoClimateOnly();
  const w = c.weather;
  const unavailable = w.condition === OPEN_METEO_UNAVAILABLE;

  const summaryMetrics: SummaryMetric[] = unavailable
    ? [
        {
          id: "om-unavailable",
          label: "Open-Meteo",
          value: "—",
          status: "API no disponible",
          trend: "stable",
          icon: "cloud-rain"
        }
      ]
    : [
        {
          id: "om-temp",
          label: "Open-Meteo · Temperatura",
          value: `${w.temperature.toFixed(1)} °C`,
          status: `Sensación ${c.apparentTemperature.toFixed(1)} °C`,
          trend: "stable",
          icon: "thermometer"
        },
        {
          id: "om-rain",
          label: "Open-Meteo · Prob. lluvia",
          value: `${c.rainProbabilityNow}%`,
          status: c.rainProbabilityNow > 60 ? "Alta" : c.rainProbabilityNow > 30 ? "Media" : "Baja",
          trend: "stable",
          icon: "cloud-rain"
        },
        {
          id: "om-rh",
          label: "Open-Meteo · Humedad relativa",
          value: `${w.relativeHumidity}%`,
          status: "Aire (referencia)",
          trend: "stable",
          icon: "droplets"
        },
        {
          id: "om-wind",
          label: "Open-Meteo · Viento",
          value: `${w.windSpeed} km/h`,
          status: "10 m",
          trend: "stable",
          icon: "activity"
        },
        ...(w.pressureHpa != null
          ? [
              {
                id: "om-press",
                label: "Open-Meteo · Presión",
                value: `${w.pressureHpa} hPa`,
                status: "Superficie",
                trend: "stable" as const,
                icon: "gauge" as const
              } satisfies SummaryMetric
            ]
          : [])
      ];

  return {
    summaryMetrics,
    weather: w,
    forecast: c.forecast,
    sensors: [],
    irrigation: buildIrrigationRecommendation({
      soilValue: null,
      rainProbabilityPercent: c.rainProbabilityNow,
      hasSoilSensor: false
    }),
    alerts: [],
    soilHumiditySeries: []
  };
}
