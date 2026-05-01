import type { SensorReadingResponse } from "@/lib/api/types";
import type { SensorBarIndicatorItem, SensorGaugeItem, SensorIconKey } from "@/modules/sensores/types";
import { formatSensorTypeTitle, getSensorSubtitle } from "@/shared/lib/sensorDisplay";
import type { SensorLevel } from "@/modules/sensores/types";

export function inferSensorIconForReading(type: string, sensorId: string): SensorIconKey {
  const t = `${type} ${sensorId}`.toLowerCase();
  if (/temp|°c/.test(t)) return "thermometer";
  if (/rain|precip|lluvia/.test(t)) return "cloud-rain";
  if (/sun|solar|radiation/.test(t)) return "sun";
  if (/press|hpa|pres/.test(t)) return "gauge";
  if (/flow|caudal|l\/min|litro/.test(t)) return "activity";
  if (/tank|tanque|nivel|wave/.test(t)) return "waves";
  return "droplets";
}

function levelFromPct(pct: number): SensorLevel {
  if (pct < 20) return "low";
  if (pct > 85) return "high";
  return "normal";
}

/**
 * Devuelve un gauge solo si el tipo/unidad permiten un rango razonable.
 */
export function readingToGaugeItem(r: SensorReadingResponse): SensorGaugeItem | null {
  const t = r.type.toLowerCase();
  const u = r.unit.trim().toLowerCase();
  const v = r.value;
  const iconKey = inferSensorIconForReading(r.type, r.sensorId);

  if (u === "%" || u === "percent") {
    return {
      id: r.sensorId,
      label: formatSensorTypeTitle(r.type),
      subtitle: getSensorSubtitle(r.sensorId, r.timestamp),
      iconKey,
      value: Math.max(0, Math.min(100, v)),
      displayValue: `${Math.round(v)}%`,
      unit: "%",
      min: 0,
      max: 100,
      warningMin: 20,
      warningMax: 80,
      criticalMin: 10,
      criticalMax: 90
    };
  }

  if (t.includes("temp") || u === "°c" || u === "ºc" || u === "c") {
    return {
      id: r.sensorId,
      label: formatSensorTypeTitle(r.type),
      subtitle: getSensorSubtitle(r.sensorId, r.timestamp),
      iconKey: "thermometer",
      value: v,
      displayValue: `${v.toFixed(1)} °C`,
      unit: "°C",
      min: -15,
      max: 50,
      warningMin: 5,
      warningMax: 38,
      criticalMin: 0,
      criticalMax: 42
    };
  }

  if (u === "hpa" || t.includes("press") || t.includes("presión")) {
    return {
      id: r.sensorId,
      label: formatSensorTypeTitle(r.type),
      subtitle: getSensorSubtitle(r.sensorId, r.timestamp),
      iconKey: "gauge",
      value: v,
      displayValue: `${Math.round(v)} hPa`,
      unit: "hPa",
      min: 960,
      max: 1040,
      warningMin: 980,
      warningMax: 1030,
      criticalMin: 970,
      criticalMax: 1045
    };
  }

  if (/l\/min|lpm|litro/.test(u) || t.includes("flow") || t.includes("caudal")) {
    return {
      id: r.sensorId,
      label: formatSensorTypeTitle(r.type),
      subtitle: getSensorSubtitle(r.sensorId, r.timestamp),
      iconKey: "activity",
      value: v,
      displayValue: `${v.toFixed(1)} ${r.unit}`,
      unit: r.unit,
      min: 0,
      max: 30,
      warningMin: 1,
      warningMax: 20,
      criticalMin: 0,
      criticalMax: 25
    };
  }

  return null;
}

export function readingToBarItemIfPercentLike(r: SensorReadingResponse): SensorBarIndicatorItem | null {
  const u = r.unit.trim();
  if (u !== "%" && u !== "percent") return null;
  const pct = Math.max(0, Math.min(100, r.value));
  return {
    id: r.sensorId,
    label: formatSensorTypeTitle(r.type),
    subtitle: getSensorSubtitle(r.sensorId, r.timestamp),
    iconKey: inferSensorIconForReading(r.type, r.sensorId),
    value: pct,
    displayValue: `${Math.round(pct)}%`,
    min: 0,
    max: 100,
    level: levelFromPct(pct)
  };
}

export function climateBarFromOpenMeteo(params: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  iconKey: SensorIconKey;
}): SensorBarIndicatorItem {
  const pct = Math.max(0, Math.min(100, ((params.value - params.min) / (params.max - params.min || 1)) * 100));
  return {
    id: params.id,
    label: params.label,
    iconKey: params.iconKey,
    value: params.value,
    displayValue: `${Math.round(params.value)}%`,
    min: params.min,
    max: params.max,
    level: levelFromPct(pct)
  };
}
