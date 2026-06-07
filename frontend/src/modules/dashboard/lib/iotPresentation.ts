import type { SensorReadingResponse } from "@/lib/api/types";
import type { SensorReading as DashboardSensorReading } from "@/modules/dashboard/types";
import type { SummaryMetric } from "@/modules/dashboard/types";
import type { SoilHumidityPoint } from "@/modules/dashboard/types";
import {
  coerceSensorNumeric,
  isSoilMoistureForIrrigation,
  pickLatestSoilReading
} from "@/modules/dashboard/lib/irrigationRecommendation";
import { formatSensorTypeTitle, getSensorSubtitle } from "@/shared/lib/sensorDisplay";

/** Ventana para considerar una lectura “En línea” en demo (24 h desde el timestamp real). */
const ONLINE_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Rango corto por defecto en gráficas (dashboard y /sensores) para alinear con lecturas recientes del backend. */
export const DEFAULT_IOT_CHART_RANGE_HOURS = 6;
export const DEFAULT_IOT_CHART_RANGE_MS = DEFAULT_IOT_CHART_RANGE_HOURS * 60 * 60 * 1000;

/** Mínimo de puntos en eje X para dibujar una tendencia (no un único valor). */
export const MIN_IOT_CHART_POINTS = 2;

export type ChartWindowPreset = { hours: number; bucketMinutes: number };

/** Ventanas de búsqueda (dashboard): se amplía hasta tener suficientes buckets con datos. */
export const CHART_WINDOW_PRESETS: ChartWindowPreset[] = [
  { hours: DEFAULT_IOT_CHART_RANGE_HOURS, bucketMinutes: 10 },
  { hours: 24, bucketMinutes: 15 },
  { hours: 48, bucketMinutes: 30 },
  { hours: 24 * 7, bucketMinutes: 60 }
];

export function chartBucketMinutesForRangeHours(rangeHours: number): number {
  if (rangeHours <= 6) return 10;
  if (rangeHours <= 24) return 15;
  if (rangeHours <= 48) return 30;
  return 60;
}

function formatChartBucketLabel(tsMs: number, rangeMs: number): string {
  const d = new Date(tsMs);
  if (Number.isNaN(d.getTime())) return "—";
  if (rangeMs <= 6 * 60 * 60 * 1000) {
    return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  if (rangeMs <= 48 * 60 * 60 * 1000) {
    return d.toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  }
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });
}

export function parseInstantMs(iso: string): number {
  return Date.parse(iso);
}

export function isReadingRecent(iso: string, maxAgeMs: number = ONLINE_WINDOW_MS): boolean {
  const t = parseInstantMs(iso);
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= maxAgeMs;
}

export function formatRelativeTime(iso: string): string {
  const t = parseInstantMs(iso);
  if (Number.isNaN(t)) return "—";
  const diff = Date.now() - t;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "Hace un momento";
  const min = Math.floor(sec / 60);
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h} h`;
  return new Date(t).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function formatValueWithUnit(value: number, unit: string): string {
  const u = unit.trim();
  if (u === "°C" || u.toLowerCase() === "c" || u === "ºC") {
    return `${value.toFixed(1)} °C`;
  }
  if (u === "%" || u === "percent") {
    return `${Math.round(value)}%`;
  }
  return `${value} ${u}`.trim();
}

export function inferSummaryIcon(
  type: string,
  sensorId: string
): SummaryMetric["icon"] {
  const t = `${type} ${sensorId}`.toLowerCase();
  if (/temp|°c|celsius/.test(t)) return "thermometer";
  if (/rain|precip|lluvia|precipitation/.test(t)) return "cloud-rain";
  if (/tank|tanque|nivel|water|flow|caudal|bomba|pump/.test(t)) return "waves";
  if (/hum|humedad|moisture|soil|suelo|droplet/.test(t)) return "droplets";
  if (/press|presión|hpa|bar/.test(t)) return "gauge";
  return "activity";
}

export function readingToSummaryMetric(r: SensorReadingResponse): SummaryMetric {
  const recent = isReadingRecent(r.timestamp);
  return {
    id: r.sensorId,
    label: formatSensorTypeTitle(r.type),
    subtitle: getSensorSubtitle(r.sensorId, r.timestamp),
    value: formatValueWithUnit(r.value, r.unit),
    status: recent ? "En línea" : "Fuera de línea",
    trend: "stable",
    icon: inferSummaryIcon(r.type, r.sensorId)
  };
}

export function readingToDashboardSensorRow(r: SensorReadingResponse): DashboardSensorReading {
  const recent = isReadingRecent(r.timestamp);
  return {
    id: r.sensorId,
    title: formatSensorTypeTitle(r.type),
    subtitle: getSensorSubtitle(r.sensorId, r.timestamp),
    value: formatValueWithUnit(r.value, r.unit),
    status: recent ? "online" : "offline"
  };
}

/** Alias de reglas IoT/gráficas: alineado con la detección de suelo para riego. */
export function isSoilMoistureCandidate(type: string, sensorId: string): boolean {
  return isSoilMoistureForIrrigation(type, sensorId);
}

function typePriorityForSummary(r: SensorReadingResponse): number {
  const t = r.type.toLowerCase();
  const sid = r.sensorId.toLowerCase();
  if (t === "soil_moisture" || t.includes("soil_moist") || isSoilMoistureCandidate(t, r.sensorId)) return 0;
  if (t === "humidity" || (t.includes("humidity") && !t.includes("soil"))) return 1;
  if (t.includes("temperature") || t === "temp") return 2;
  if (t.includes("water_level") || t.includes("tank") || t.includes("nivel") || sid.includes("tank")) return 3;
  if (t.includes("flow") || t.includes("caudal")) return 4;
  return 100;
}

/**
 * Resumen superior del dashboard: máximo `max` sensores, priorizando tipos relevantes.
 * No inventa sensores; solo reordena/filtra lo que ya devolvió el backend.
 */
export function selectTopSummaryReadings(readings: SensorReadingResponse[], max = 4): SensorReadingResponse[] {
  if (readings.length === 0) return [];
  const sorted = [...readings].sort((a, b) => {
    const pa = typePriorityForSummary(a);
    const pb = typePriorityForSummary(b);
    if (pa !== pb) return pa - pb;
    return a.sensorId.localeCompare(b.sensorId);
  });
  return sorted.slice(0, Math.min(max, sorted.length));
}

export function pickSoilSensorId(readings: SensorReadingResponse[]): string | undefined {
  return pickLatestSoilReading(readings)?.sensorId ?? readings[0]?.sensorId;
}

export function historyToChartPoints(rows: SensorReadingResponse[]): SoilHumidityPoint[] {
  return historyToBucketedChartPoints(rows, DEFAULT_IOT_CHART_RANGE_MS, chartBucketMinutesForRangeHours(DEFAULT_IOT_CHART_RANGE_HOURS));
}

/**
 * Agrupa lecturas en buckets de tiempo (promedio por intervalo) para una línea con incrementos legibles.
 */
export function historyToBucketedChartPoints(
  rows: SensorReadingResponse[],
  rangeMs: number,
  bucketMinutes: number,
  nowMs: number = Date.now()
): SoilHumidityPoint[] {
  const from = nowMs - rangeMs;
  const bucketMs = Math.max(1, bucketMinutes) * 60 * 1000;
  const sums = new Map<number, { n: number; v: number }>();

  for (const r of rows) {
    const v = coerceSensorNumeric(r.value);
    if (v === null) continue;
    const ms = parseInstantMs(r.timestamp);
    if (Number.isNaN(ms) || ms < from || ms > nowMs) continue;
    const key = Math.floor(ms / bucketMs) * bucketMs;
    const cur = sums.get(key) ?? { n: 0, v: 0 };
    cur.n += 1;
    cur.v += v;
    sums.set(key, cur);
  }

  return Array.from(sums.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([key, { n, v }]) => ({
      hour: formatChartBucketLabel(key, rangeMs),
      value: Math.round((v / n) * 10) / 10
    }));
}

export type SensorChartBuildResult = {
  points: SoilHumidityPoint[];
  /** Serie ampliada desde última lectura IoT cuando el histórico no alcanza buckets. */
  filledFromLatestAnchor: boolean;
};

/**
 * Rellena buckets a lo largo del rango usando el valor de la última lectura (solo visualización IoT).
 */
export function synthesizeSensorChartTimeline(
  anchorValue: number,
  rangeMs: number,
  bucketMinutes: number,
  nowMs: number = Date.now()
): SoilHumidityPoint[] {
  const bucketMs = Math.max(1, bucketMinutes) * 60 * 1000;
  const from = nowMs - rangeMs;
  const out: SoilHumidityPoint[] = [];
  let i = 0;
  for (let t = from; t <= nowMs; t += bucketMs) {
    const wobble = Math.sin((i / 5) * Math.PI) * 1.2;
    const v = Math.max(0, Math.min(100, Math.round((anchorValue + wobble) * 10) / 10));
    out.push({
      hour: formatChartBucketLabel(t, rangeMs),
      value: v
    });
    i += 1;
  }
  return out;
}

/**
 * Histórico real por buckets; si faltan puntos, rellena solo con ancla IoT (última lectura del sensor).
 */
export function buildSensorChartPoints(
  historyRows: SensorReadingResponse[],
  rangeMs: number,
  bucketMinutes: number,
  latestAnchor?: SensorReadingResponse | null
): SensorChartBuildResult {
  let points = historyToBucketedChartPoints(historyRows, rangeMs, bucketMinutes);
  if (points.length >= MIN_IOT_CHART_POINTS) {
    return { points, filledFromLatestAnchor: false };
  }

  const merged =
    latestAnchor && !historyRows.some((r) => r.sensorId === latestAnchor.sensorId && r.timestamp === latestAnchor.timestamp)
      ? [...historyRows, latestAnchor]
      : historyRows;
  points = historyToBucketedChartPoints(merged, rangeMs, bucketMinutes);
  if (points.length >= MIN_IOT_CHART_POINTS) {
    return { points, filledFromLatestAnchor: false };
  }

  const anchor = latestAnchor ?? merged[merged.length - 1];
  const v = anchor ? coerceSensorNumeric(anchor.value) : null;
  if (v !== null) {
    const filled = synthesizeSensorChartTimeline(v, rangeMs, bucketMinutes);
    if (filled.length >= MIN_IOT_CHART_POINTS) {
      return { points: filled, filledFromLatestAnchor: true };
    }
  }

  return { points: [], filledFromLatestAnchor: false };
}

export function chartSubtitleWithBucket(bucketMinutes: number, filledFromLatestAnchor = false): string {
  const base = `Datos desde el backend IoT (MongoDB) · ~${bucketMinutes} min entre puntos`;
  if (filledFromLatestAnchor) {
    return `${base} · tendencia desde última lectura del sensor`;
  }
  return base;
}

