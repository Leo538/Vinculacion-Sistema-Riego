import type { SensorReadingResponse } from "@/lib/api/types";
import type { OpenMeteoClimateBundle } from "@/modules/dashboard/data/openMeteoClimate";
import {
  OPEN_METEO_LOCATION_LABEL,
  OPEN_METEO_UNAVAILABLE
} from "@/modules/dashboard/data/openMeteoClimate";
import type { AlertItem } from "@/modules/dashboard/types";
import { isSoilMoistureForIrrigation } from "@/modules/dashboard/lib/irrigationRecommendation";

const STALE_MS = 24 * 60 * 60 * 1000;

function parseMs(iso: string): number {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? NaN : t;
}

function isReadingOlderThan(ms: number, iso: string): boolean {
  const t = parseMs(iso);
  if (Number.isNaN(t)) return true;
  return Date.now() - t > ms;
}

function isAmbientHumidity(type: string, sensorId: string): boolean {
  if (isSoilMoistureForIrrigation(type, sensorId)) return false;
  const t = `${type}`.toLowerCase();
  return t.includes("humidity") || t.includes("humedad");
}

function isTemperatureReading(type: string): boolean {
  const t = type.toLowerCase();
  return t.includes("temperature") || t.includes("temperatura") || t === "temp" || /\btemp\b/.test(t);
}

function openMeteoOk(climate: OpenMeteoClimateBundle): boolean {
  return climate.weather.condition !== OPEN_METEO_UNAVAILABLE;
}

/**
 * Advertencias derivadas solo de datos reales: últimas lecturas IoT y bundle Open-Meteo (sin mock).
 */
export function buildAlertsFromReadingsAndClimate(
  readings: SensorReadingResponse[],
  climate: OpenMeteoClimateBundle
): AlertItem[] {
  const out: AlertItem[] = [];

  for (const r of readings) {
    const { sensorId, type, value, timestamp } = r;

    if (isReadingOlderThan(STALE_MS, timestamp)) {
      out.push({
        id: `iot-stale-${sensorId}`,
        title: "Sensor sin señal",
        severity: "media",
        detail: `El sensor ${sensorId} no reporta datos recientes.`
      });
      continue;
    }

    if (isSoilMoistureForIrrigation(type, sensorId)) {
      if (value < 30) {
        const x = Number.isFinite(value) ? Math.round(value) : value;
        out.push({
          id: `iot-soil-low-${sensorId}`,
          title: "Humedad de suelo baja",
          severity: "media",
          detail: `La humedad de suelo está en ${x}%. Se recomienda revisar el riego.`
        });
      } else if (value > 70) {
        const x = Number.isFinite(value) ? Math.round(value) : value;
        out.push({
          id: `iot-soil-high-${sensorId}`,
          title: "Humedad de suelo alta",
          severity: "baja",
          detail: `La humedad de suelo está en ${x}%. Evite riego adicional.`
        });
      }
      continue;
    }

    if (isAmbientHumidity(type, sensorId)) {
      if (value > 80) {
        const x = Number.isFinite(value) ? Math.round(value) : value;
        out.push({
          id: `iot-air-rh-high-${sensorId}`,
          title: "Humedad ambiental alta",
          severity: "baja",
          detail: `La humedad ambiental está en ${x}%. Puede favorecer condensación o afectar el cultivo.`
        });
      } else if (value < 30) {
        const x = Number.isFinite(value) ? Math.round(value) : value;
        out.push({
          id: `iot-air-rh-low-${sensorId}`,
          title: "Humedad ambiental baja",
          severity: "media",
          detail: `La humedad ambiental está en ${x}%. Revise condiciones del entorno.`
        });
      }
      continue;
    }

    if (isTemperatureReading(type)) {
      const u = `${r.unit}`.trim();
      const uLow = u.toLowerCase().replace(/\s/g, "");
      const raw = value;
      const isFahrenheit = /°f|℉|fahrenheit|^f$/i.test(uLow) || uLow === "f";
      const celsius = isFahrenheit && Number.isFinite(raw) ? ((raw - 32) * 5) / 9 : raw;
      if (Number.isFinite(celsius) && celsius > 30) {
        const disp =
          `${Number.isFinite(raw) ? raw.toFixed(1) : raw}` + (u ? ` ${u}` : "");
        out.push({
          id: `iot-temp-high-${sensorId}`,
          title: "Temperatura alta",
          severity: "media",
          detail: `La temperatura registrada es ${disp}. Revisar ventilación o exposición solar.`
        });
      }
    }
  }

  if (!openMeteoOk(climate)) {
    return dedupePreserveOrder(out);
  }

  const rain = climate.rainProbabilityNow;
  if (Number.isFinite(rain) && rain >= 60) {
    out.push({
      id: "om-rain-high",
      title: "Alta probabilidad de lluvia",
      severity: "baja",
      detail: `Open-Meteo indica ${rain}% de probabilidad de lluvia. Evite riego preventivo.`
    });
  }

  const rhExt = climate.weather.relativeHumidity;
  if (Number.isFinite(rhExt) && rhExt > 80) {
    out.push({
      id: "om-rh-high",
      title: "Humedad externa alta",
      severity: "baja",
      detail: `Open-Meteo indica humedad relativa de ${Math.round(rhExt)}% en ${OPEN_METEO_LOCATION_LABEL}.`
    });
  }

  const hp = climate.weather.pressureHpa;
  if (hp !== undefined && hp !== null && Number.isFinite(Number(hp)) && Number(hp) < 700) {
    const p = Math.round(Number(hp));
    out.push({
      id: "om-pressure-low",
      title: "Presión atmosférica baja",
      severity: "baja",
      detail: `La presión actual es ${p} hPa según Open-Meteo.`
    });
  }

  return dedupePreserveOrder(out);
}

function dedupePreserveOrder(items: AlertItem[]): AlertItem[] {
  const seen = new Set<string>();
  const res: AlertItem[] = [];
  for (const a of items) {
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    res.push(a);
  }
  return res;
}
