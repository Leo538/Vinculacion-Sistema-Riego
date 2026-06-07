import type { SensorReadingResponse } from "@/lib/api/types";
import type { OpenMeteoClimateBundle } from "@/modules/dashboard/data/openMeteoClimate";
import {
  OPEN_METEO_LOCATION_LABEL,
  OPEN_METEO_UNAVAILABLE
} from "@/modules/dashboard/data/openMeteoClimate";
import { isReadingRecent } from "@/modules/dashboard/lib/iotPresentation";
import { coerceSensorNumeric, isSoilMoistureForIrrigation } from "@/modules/dashboard/lib/irrigationRecommendation";

/** Humedad relativa ambiental (Open-Meteo), crítico por encima. */
export const ALERT_AMBIENT_RH_CRITICAL_OPEN_METEO = 85;
/** Probabilidad de precipitación (Open-Meteo), crítico por encima. */
export const ALERT_RAIN_PROB_CRITICAL_OPEN_METEO = 80;
/** Humedad de suelo IoT (%), crítico por debajo. */
export const ALERT_SOIL_MOIST_LOW_IOT = 30;
/** Presión superficial (hPa Open-Meteo): por debajo se considera baja para aviso contextual. */
export const ALERT_PRESSURE_LOW_HPA_OPEN_METEO = 1008;

export type AlertPageSlotId =
  | "ambient_rh_openmeteo"
  | "soil_moisture_iot"
  | "rain_probability_openmeteo"
  | "pressure_openmeteo";

export interface AlertPageSlot {
  id: AlertPageSlotId;
  /** Título principal tipo "Alerta: …" para lectura rápida */
  headline: string;
  active: boolean;
  /** Bloque “valor / probabilidad” con umbral cuando aplica */
  valueLine: string;
  recommendation: string;
  /** Etiqueta corta (badge) */
  sourceTag: string;
}

function openMeteoDataUsable(climate: OpenMeteoClimateBundle): boolean {
  return climate.weather.condition !== OPEN_METEO_UNAVAILABLE;
}

function minRecentSoilMoisturePercent(readings: SensorReadingResponse[]): number | null {
  let min: number | null = null;
  for (const r of readings) {
    if (!isSoilMoistureForIrrigation(r.type, r.sensorId)) continue;
    if (!isReadingRecent(r.timestamp)) continue;
    const v = coerceSensorNumeric(r.value);
    if (v === null) continue;
    if (min === null || v < min) min = v;
  }
  return min;
}

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function buildAlertPageSlots(
  readings: SensorReadingResponse[],
  climate: OpenMeteoClimateBundle
): AlertPageSlot[] {
  const omOk = openMeteoDataUsable(climate);

  const rh = climate.weather.relativeHumidity;
  const rhNum = typeof rh === "number" && Number.isFinite(rh) ? clampPct(rh) : null;

  const rainNow = clampPct(climate.rainProbabilityNow);
  const hpRaw = climate.weather.pressureHpa;
  const hp = hpRaw !== undefined && hpRaw !== null ? Number(hpRaw) : null;

  const soilMinPct = minRecentSoilMoisturePercent(readings);
  const hadRecentSoilSample = soilMinPct !== null;

  const ambientRhActive = omOk && rhNum !== null && rhNum > ALERT_AMBIENT_RH_CRITICAL_OPEN_METEO;
  const rainActive = omOk && rainNow > ALERT_RAIN_PROB_CRITICAL_OPEN_METEO;
  const pressureEvaluable =
    omOk &&
    hp !== null &&
    Number.isFinite(hp) &&
    climate.weather.pressureHpa !== undefined &&
    climate.weather.pressureHpa !== null;
  const pressureActive = pressureEvaluable === true && hp !== null && hp < ALERT_PRESSURE_LOW_HPA_OPEN_METEO;
  const soilActive = hadRecentSoilSample && soilMinPct !== null && soilMinPct < ALERT_SOIL_MOIST_LOW_IOT;

  const ambientSlot: AlertPageSlot = ambientRhActive
    ? {
        id: "ambient_rh_openmeteo",
        headline: "Alerta: Humedad ambiental alta",
        active: true,
        valueLine: `Valor actual: ${rhNum}% (superior al umbral de ${ALERT_AMBIENT_RH_CRITICAL_OPEN_METEO}%). Open‑Meteo · ${OPEN_METEO_LOCATION_LABEL}.`,
        recommendation:
          "Evite combinaciones que incrementen aún más la humedad relativa sin renovar el aire. Trabaje con ventilación y control de temperatura del espacio.",
        sourceTag: "Open‑Meteo"
      }
    : {
        id: "ambient_rh_openmeteo",
        headline: "Alerta: Humedad ambiental alta",
        active: false,
        valueLine: omOk
          ? rhNum !== null
            ? `Valor actual: ${rhNum}% (no supera el umbral de ${ALERT_AMBIENT_RH_CRITICAL_OPEN_METEO}%). ${OPEN_METEO_LOCATION_LABEL}.`
            : "Sin valor de humedad relativa en la respuesta actual de Open‑Meteo."
          : "Open‑Meteo no disponible: no hay referencia válida para humedad exterior.",
        recommendation:
          "No hay condición de alerta con los datos actuales. En invernadero, siga renovando aire si la HR sube por riego o nebulización.",
        sourceTag: "Open‑Meteo"
      };

  const soilSlot: AlertPageSlot =
    soilActive && soilMinPct !== null
      ? {
          id: "soil_moisture_iot",
          headline: "Alerta: Humedad de suelo baja",
          active: true,
          valueLine: `Valor actual: ${Math.round(soilMinPct)}% (inferior al umbral de ${ALERT_SOIL_MOIST_LOW_IOT}%). Mínimo entre sensores de suelo con lectura reciente (≤24 h).`,
          recommendation:
            "Priorice revisar el riego. Si Open‑Meteo indica lluvias próximas, puede posponer parte del riego según el campo y el drenaje.",
          sourceTag: "Backend IoT"
        }
      : {
          id: "soil_moisture_iot",
          headline: "Alerta: Humedad de suelo baja",
          active: false,
          valueLine: hadRecentSoilSample
            ? `Valor actual: ${Math.round(soilMinPct ?? 0)}% (no está por debajo del umbral de ${ALERT_SOIL_MOIST_LOW_IOT}%).`
            : "Sin lectura reciente de humedad de suelo con valor numérico válido (≤24 h) para este dispositivo en el backend.",
          recommendation: hadRecentSoilSample
            ? "Mantenga el monitoreo; el suelo no cumple criterio de alerta baja con el dato actual."
            : "Registre o conecte sensores de suelo vía MQTT al backend para poder evaluar esta alerta.",
          sourceTag: "Backend IoT"
        };

  const rainSlot: AlertPageSlot = rainActive
    ? {
        id: "rain_probability_openmeteo",
        headline: "Alerta: Alta probabilidad de lluvia",
        active: true,
        valueLine: `Probabilidad: ${rainNow}% (según Open‑Meteo; umbral ${ALERT_RAIN_PROB_CRITICAL_OPEN_METEO}%). ${OPEN_METEO_LOCATION_LABEL}.`,
        recommendation:
          "Evite riego preventivo hasta que pase el tramo de lluvias más probable. Revise válvulas o drenaje en la parcela expuesta.",
        sourceTag: "Open‑Meteo"
      }
    : {
        id: "rain_probability_openmeteo",
        headline: "Alerta: Alta probabilidad de lluvia",
        active: false,
        valueLine: omOk
          ? `Probabilidad actual modelada: ${rainNow}% (${OPEN_METEO_LOCATION_LABEL}); no supera el umbral de ${ALERT_RAIN_PROB_CRITICAL_OPEN_METEO}%.`
          : "Sin pronóstico Open‑Meteo válido en este momento.",
        recommendation: omOk
          ? "Puede planificar riego u otras labores cruzando con sensores locales y el resto de alertas."
          : "Recargue más tarde o compruebe la red; sin Open‑Meteo no se evalúa la probabilidad horaria.",
        sourceTag: "Open‑Meteo"
      };

  const pressureSlot: AlertPageSlot =
    pressureActive && hp !== null
      ? {
          id: "pressure_openmeteo",
          headline: "Alerta: Presión atmosférica baja",
          active: true,
          valueLine: `Valor actual: ${Math.round(hp)} hPa (inferior al umbral de ${ALERT_PRESSURE_LOW_HPA_OPEN_METEO} hPa). Open‑Meteo · ${OPEN_METEO_LOCATION_LABEL}.`,
          recommendation:
            "Las depresiones suelen ir acompañadas de más nubosidad o precipitaciones en el modelo. Cruce esta alerta con la probabilidad de lluvia.",
          sourceTag: "Open‑Meteo"
        }
      : {
          id: "pressure_openmeteo",
          headline: "Alerta: Presión atmosférica baja",
          active: false,
          valueLine:
            omOk ?
              pressureEvaluable && hp !== null
                ? `Valor actual: ${Math.round(hp)} hPa (no se considera baja con el umbral ${ALERT_PRESSURE_LOW_HPA_OPEN_METEO} hPa).`
                : "Presión superficial no incluida en esta respuesta de Open‑Meteo."
            : "Open‑Meteo no disponible; presión sin evaluar.",
          recommendation:
            pressureEvaluable && hp !== null
              ? `Con ${Math.round(hp)} hPa no se activa la alerta de presión baja.`
              : "Cuando el modelo devuelva presión superficial, esta vigilancia será más fiable.",
          sourceTag: "Open‑Meteo"
        };

  return [ambientSlot, soilSlot, rainSlot, pressureSlot];
}
