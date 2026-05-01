import type { IrrigationDecision } from "@/modules/dashboard/types";
import type { SensorReadingResponse } from "@/lib/api/types";

function parseReadingInstantMs(iso: string): number {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
}

/** type o sensorId contienen estos indicios de humedad de suelo (backend IoT). */
export function isSoilMoistureForIrrigation(type: string, sensorId: string): boolean {
  const hay = `${type} ${sensorId}`.toLowerCase();
  return (
    hay.includes("soil_moisture") ||
    hay.includes("humedad_suelo") ||
    hay.includes("suelo") ||
    hay.includes("moisture") ||
    hay.includes("substrato") ||
    hay.includes("substrate")
  );
}

/** Entre lecturas candidatas, la más reciente por timestamp (empate: primera estable). */
export function pickLatestSoilReading(readings: SensorReadingResponse[]): SensorReadingResponse | null {
  const soil = readings.filter((r) => isSoilMoistureForIrrigation(r.type, r.sensorId));
  if (soil.length === 0) return null;
  return soil.reduce((best, cur) =>
    parseReadingInstantMs(cur.timestamp) > parseReadingInstantMs(best.timestamp) ? cur : best
  );
}

function clampRainPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Recomendación unificada (Dashboard y /riego): suelo IoT + prob. lluvia Open-Meteo (Tisaleo).
 */
export function buildIrrigationRecommendation(params: {
  soilValue: number | null;
  rainProbabilityPercent: number;
  hasSoilSensor: boolean;
}): IrrigationDecision {
  const rain = clampRainPct(params.rainProbabilityPercent);

  if (!params.hasSoilSensor || params.soilValue === null) {
    return {
      action: "Sin dato de suelo",
      suggestedTime: "No disponible",
      reason: "No se encontró un sensor de humedad de suelo en el backend IoT."
    };
  }

  const v = params.soilValue;

  if (v < 30) {
    if (rain < 40) {
      return {
        action: "Regar ahora",
        suggestedTime: "15–20 minutos",
        reason: `Humedad de suelo IoT ~${Math.round(v)}% y baja probabilidad de lluvia (${rain}%) según Open-Meteo.`
      };
    }
    return {
      action: "Esperar lluvia",
      suggestedTime: "Revisar en 2 horas",
      reason: "Humedad de suelo baja, pero existe probabilidad de lluvia según Open-Meteo."
    };
  }

  if (v <= 60) {
    return {
      action: "No regar",
      suggestedTime: "Revisar más tarde",
      reason: "La humedad de suelo IoT se mantiene en un rango adecuado."
    };
  }

  return {
    action: "No regar",
    suggestedTime: "Revisar en 2 horas",
    reason: "La humedad de suelo IoT es suficiente para el cultivo."
  };
}
