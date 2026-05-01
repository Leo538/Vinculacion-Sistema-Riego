import type { SensorReadingResponse } from "@/lib/api/types";
import type { SensorReading as DashboardSensorReading } from "@/modules/dashboard/types";
import type { SummaryMetric } from "@/modules/dashboard/types";
import type { SoilHumidityPoint } from "@/modules/dashboard/types";
import { isSoilMoistureForIrrigation, pickLatestSoilReading } from "@/modules/dashboard/lib/irrigationRecommendation";
import { formatSensorTypeTitle, getSensorSubtitle } from "@/shared/lib/sensorDisplay";

/** Ventana para considerar una lectura “En línea” en demo (24 h desde el timestamp real). */
const ONLINE_WINDOW_MS = 24 * 60 * 60 * 1000;

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
  const sorted = [...rows].sort((a, b) => parseInstantMs(a.timestamp) - parseInstantMs(b.timestamp));
  return sorted.map((r) => ({
    hour: new Date(parseInstantMs(r.timestamp)).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }),
    value: r.value
  }));
}

