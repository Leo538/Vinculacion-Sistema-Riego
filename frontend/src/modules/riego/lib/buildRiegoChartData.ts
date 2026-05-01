import type { OpenMeteoHourlyPoint } from "@/modules/dashboard/data/openMeteoClimate";
import type { ForecastDay } from "@/modules/dashboard/types";
import type { IrrigationAction } from "@/modules/dashboard/types";
import { parseInstantMs, isReadingRecent } from "@/modules/dashboard/lib/iotPresentation";
import {
  buildIrrigationRecommendation,
  coerceSensorNumeric,
  isSoilMoistureForIrrigation
} from "@/modules/dashboard/lib/irrigationRecommendation";
import type { SensorReadingResponse } from "@/lib/api/types";

export const RIEGO_CHART_EMPTY_MESSAGE = "Sin datos para la comparación con los filtros actuales.";

export const RIEGO_SOIL_TREND_EMPTY_MESSAGE =
  "No hay lecturas de humedad de suelo en este rango con los filtros actuales. Comprueba el histórico en el backend o amplía tipo/estado (p. ej. “Todos”).";

export const RIEGO_SOIL_TREND_INSUFFICIENT_MESSAGE =
  "Hay muy pocas lecturas agrupadas en este intervalo para una tendencia fiable; con más muestras en el rango seleccionado la línea será más estable.";

/** Misma clave que el selector de rangos en /riego */
export type RiegoTimeRangeKey = "24h" | "7d" | "30d";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Nivel ordenado solo para graficar líneas/bar (no sustituye el texto IoT real). */
export function irrigationActionToLevel(action: IrrigationAction): number {
  switch (action) {
    case "Regar ahora":
      return 4;
    case "Esperar lluvia":
      return 3;
    case "No regar":
      return 2;
    case "Sin dato de suelo":
      return 1;
    default:
      return 1;
  }
}

export function irrigationAxisLabel(level: number): string {
  if (level >= 4) return "Regar";
  if (level >= 3) return "Esperar lluvia";
  if (level >= 2) return "No regar";
  return "Sin datos suelo";
}

export function normalizeTypeKey(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Incluye agua nivel/tanque (no necesariamente flujo volumétrico). */
export function isTankWaterLevelReading(type: string, sensorId: string): boolean {
  const h = `${type} ${sensorId}`.toLowerCase();
  return (
    h.includes("water_level") ||
    h.includes("tank_level") ||
    (h.includes("tanque") && !h.includes("caudal")) ||
    (h.includes("tank") && !h.includes("flow")) ||
    (h.includes("nivel") && (h.includes("tanque") || h.includes("tank")))
  );
}

export function filterRiegoReadings(
  readings: SensorReadingResponse[],
  typeFilter: string,
  statusFilter: "all" | "active" | "inactive",
  normalizeTypeFn: typeof normalizeTypeKey
): SensorReadingResponse[] {
  return readings.filter((r) => {
    const typeOk = typeFilter === "all" || normalizeTypeFn(r.type) === normalizeTypeFn(typeFilter);
    const okStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? isReadingRecent(r.timestamp) : !isReadingRecent(r.timestamp));
    return typeOk && okStatus;
  });
}

/** Humedad de suelo (reglas mismo que recomendación) desde lecturas ya filtradas UI. */
export function soilMoistureFromFiltered(readings: SensorReadingResponse[]): SensorReadingResponse[] {
  return readings.filter((r) => isSoilMoistureForIrrigation(r.type, r.sensorId));
}

export function sliceSinceMs(readings: SensorReadingResponse[], ms: number): SensorReadingResponse[] {
  const from = Date.now() - ms;
  return readings.filter((r) => parseInstantMs(r.timestamp) >= from);
}

export function nearestOpenMeteoRainPct(hourly: OpenMeteoHourlyPoint[], readingIso: string): number {
  const target = Date.parse(readingIso);
  if (!hourly.length || Number.isNaN(target)) return 0;
  let bestPct = hourly[0]!.rainPct;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (const h of hourly) {
    const t = Date.parse(h.time);
    if (Number.isNaN(t)) continue;
    const diff = Math.abs(t - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestPct = h.rainPct;
    }
  }
  return bestPct;
}

export type EvolutionRow = {
  timeLabel: string;
  nivel: number;
  accion: string;
};

/** Punto tiempo + humedad + lluvia (horaria cercana Open-Meteo). */
export type SoilRainRow = {
  timeLabel: string;
  soil: number | null;
  lluvia: number;
};

export type DailyMeteoRecoRow = {
  dayShort: string;
  isoDate?: string;
  lluviaPct: number;
  tempMedia: number;
  recNivel: number;
  recomendacion: string;
};

export type SoilTrendRow = {
  dateLabel: string;
  valor: number;
};

export type TankBarRow = {
  label: string;
  nivel: number;
};

/** Inicio de hora en hora local (alineación con Open-Meteo timezone=auto). */
export function hourBucketLocal(tsMs: number): number {
  const d = new Date(tsMs);
  if (Number.isNaN(d.getTime())) return 0;
  d.setMilliseconds(0);
  d.setSeconds(0);
  d.setMinutes(0);
  return d.getTime();
}

function formatHourLocal(tsMs: number): string {
  return new Date(tsMs).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatEvolutionPointLabel(tsMs: number, sensorId: string, rangeKey: RiegoTimeRangeKey): string {
  const d = new Date(tsMs);
  if (Number.isNaN(d.getTime())) return sensorId;
  if (rangeKey === "24h") {
    return `${formatHourLocal(tsMs)} · ${sensorId}`;
  }
  const datePart = d.toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "short" });
  const timePart = formatHourLocal(tsMs);
  return `${datePart} · ${timePart} · ${sensorId}`;
}

export function buildRecommendationEvolution(
  soilsChrono: SensorReadingResponse[],
  hourly: OpenMeteoHourlyPoint[],
  rangeKey: RiegoTimeRangeKey = "24h"
): EvolutionRow[] {
  const sorted = [...soilsChrono]
    .filter((r) => coerceSensorNumeric(r.value) !== null)
    .sort((a, b) => parseInstantMs(a.timestamp) - parseInstantMs(b.timestamp));
  return sorted.map((r) => {
    const val = coerceSensorNumeric(r.value);
    const rain = nearestOpenMeteoRainPct(hourly, r.timestamp);
    const dec = buildIrrigationRecommendation({
      soilValue: val,
      rainProbabilityPercent: rain,
      hasSoilSensor: true
    });
    const nivel = irrigationActionToLevel(dec.action);
    return {
      timeLabel: formatEvolutionPointLabel(parseInstantMs(r.timestamp), r.sensorId, rangeKey),
      nivel,
      accion: dec.action
    };
  });
}

/** Promedio humedad de suelo por hora local (útiles 24h). */
export function buildSoilRainDual24h(
  soilsFiltered: SensorReadingResponse[],
  hourly: OpenMeteoHourlyPoint[]
): SoilRainRow[] {
  const since = Date.now() - 24 * 60 * 60 * 1000;

  const soilRows = soilsFiltered.filter((r) => parseInstantMs(r.timestamp) >= since);
  const hourlySoilBuckets = new Map<number, number[]>();
  for (const r of soilRows) {
    const ms = parseInstantMs(r.timestamp);
    const h = hourBucketLocal(ms);
    if (!hourlySoilBuckets.has(h)) hourlySoilBuckets.set(h, []);
    hourlySoilBuckets.get(h)!.push(r.value);
  }

  const sortedHoursClimate = hourly
    .filter((h) => {
      const t = Date.parse(h.time);
      return !Number.isNaN(t) && t >= since;
    })
    .sort((a, b) => Date.parse(a.time) - Date.parse(b.time));

  if (!sortedHoursClimate.length) return [];

  return sortedHoursClimate.map((slot) => {
    const ms = Date.parse(slot.time);
    const key = hourBucketLocal(Number.isNaN(ms) ? Date.now() : ms);
    const vals = hourlySoilBuckets.get(key);
    const soilAgg = vals?.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;

    return {
      timeLabel: formatHourLocal(ms),
      soil: soilAgg === null ? null : Math.round(soilAgg * 10) / 10,
      lluvia: slot.rainPct
    };
  });
}

/** YYYY-MM-DD en calendario local (misma base que lecturas agrupadas en `averageSoilByCalendarDay`). */
function localCalendarIsoDateFromMs(ms: number): string | null {
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function averageSoilByCalendarDay(soilRows: SensorReadingResponse[]): Map<string, number> {
  const sums = new Map<string, { n: number; v: number }>();
  for (const r of soilRows) {
    const num = coerceSensorNumeric(r.value);
    if (num === null) continue;
    const d = new Date(parseInstantMs(r.timestamp));
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const cur = sums.get(key) ?? { n: 0, v: 0 };
    cur.n += 1;
    cur.v += num;
    sums.set(key, cur);
  }
  const avg = new Map<string, number>();
  for (const [k, { n, v }] of sums) {
    avg.set(k, Math.round((v / n) * 10) / 10);
  }
  return avg;
}

/**
 * Último valor válido de humedad conocido hasta ese día calendario (inclusive): para días futuros sin
 * lecturas aún permite combinar último estado IoT con la prob. lluvia diaria sin inventar valores.
 */
function latestSoilMoistureOnOrBeforeCalendarDay(
  soilsChronoAscending: SensorReadingResponse[],
  isoDate: string
): number | null {
  let bestMs = -Infinity;
  let bestVal: number | null = null;
  for (const r of soilsChronoAscending) {
    const ms = parseInstantMs(r.timestamp);
    const ymd = localCalendarIsoDateFromMs(ms);
    if (!ymd || ymd > isoDate) continue;
    const num = coerceSensorNumeric(r.value);
    if (num === null) continue;
    if (ms >= bestMs) {
      bestMs = ms;
      bestVal = num;
    }
  }
  return bestVal;
}

function latestSoilMoistureGlobally(soilsChronoAscending: SensorReadingResponse[]): number | null {
  let bestMs = -Infinity;
  let bestVal: number | null = null;
  for (const r of soilsChronoAscending) {
    const ms = parseInstantMs(r.timestamp);
    const num = coerceSensorNumeric(r.value);
    if (num === null) continue;
    if (ms >= bestMs) {
      bestMs = ms;
      bestVal = num;
    }
  }
  return bestVal;
}

export function buildDailyMeteoRecommendation(
  forecast: ForecastDay[],
  soilHistory30dFiltered: SensorReadingResponse[]
): DailyMeteoRecoRow[] {
  const soils = soilMoistureFromFiltered(soilHistory30dFiltered);
  const canUseSoil = soils.some((r) => coerceSensorNumeric(r.value) !== null);
  const byDayAll = averageSoilByCalendarDay(soils.slice());
  const soilsChronoAscending = [...soils].sort((a, b) => parseInstantMs(a.timestamp) - parseInstantMs(b.timestamp));

  const out: DailyMeteoRecoRow[] = [];

  for (const fd of forecast) {
    const iso = fd.isoDate;
    let soilVal: number | null = null;

    if (canUseSoil && iso && byDayAll.has(iso)) {
      soilVal = byDayAll.get(iso)!;
    } else if (canUseSoil && iso) {
      soilVal = latestSoilMoistureOnOrBeforeCalendarDay(soilsChronoAscending, iso);
    } else if (canUseSoil && !iso) {
      soilVal = latestSoilMoistureGlobally(soilsChronoAscending);
    }

    const dec = buildIrrigationRecommendation({
      soilValue: soilVal,
      rainProbabilityPercent: fd.rainProbability,
      hasSoilSensor: canUseSoil
    });

    out.push({
      dayShort: fd.day,
      isoDate: iso,
      lluviaPct: fd.rainProbability,
      tempMedia: Math.round(((fd.minTemp + fd.maxTemp) / 2) * 10) / 10,
      recNivel: irrigationActionToLevel(dec.action),
      recomendacion: dec.action
    });
  }
  return out;
}

/** Tendencia alineada al rango /riego: 24h por horas locales; 7d / 30d por media diaria. */
export function buildSoilMoistureTrend(
  filteredReadings: SensorReadingResponse[],
  rangeKey: RiegoTimeRangeKey,
  rangeMs: number
): SoilTrendRow[] {
  const cutoff = Date.now() - rangeMs;
  const soils = soilMoistureFromFiltered(filteredReadings).filter((r) => parseInstantMs(r.timestamp) >= cutoff);

  if (rangeKey === "24h") {
    const buckets = new Map<number, number[]>();
    for (const r of soils) {
      const ms = parseInstantMs(r.timestamp);
      if (Number.isNaN(ms)) continue;
      const v = coerceSensorNumeric(r.value);
      if (v === null) continue;
      const key = hourBucketLocal(ms);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(v);
    }
    const sortedBk = Array.from(buckets.keys()).sort((a, b) => a - b);
    return sortedBk.map((bk) => {
      const vals = buckets.get(bk)!;
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      const d = new Date(bk);
      return {
        dateLabel: d.toLocaleString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        }),
        valor: Math.round(avg * 10) / 10
      };
    });
  }

  const byDay = averageSoilByCalendarDay(soils);
  const keys = Array.from(byDay.keys()).sort();
  const cy = String(new Date().getFullYear());
  return keys.map((k) => {
    const y = k.slice(0, 4);
    const base = `${k.slice(8, 10)}/${k.slice(5, 7)}`;
    const dateLabel = y !== cy ? `${base}/${y.slice(2)}` : base;
    return { dateLabel, valor: byDay.get(k)! };
  });
}

/** @deprecated usar buildSoilMoistureTrend(..., "30d", 30 * día) si el rango viene de la UI */
export function buildSoilTrend30d(filteredReadings: SensorReadingResponse[]): SoilTrendRow[] {
  return buildSoilMoistureTrend(filteredReadings, "30d", 30 * DAY_MS);
}

export function buildTankBars24h(tankFiltered: SensorReadingResponse[]): TankBarRow[] {
  const since = Date.now() - 24 * 60 * 60 * 1000;
  const tank = tankFiltered.filter((r) => isTankWaterLevelReading(r.type, r.sensorId) && parseInstantMs(r.timestamp) >= since);

  const buckets = new Map<number, number[]>();
  for (const r of tank) {
    const ms = parseInstantMs(r.timestamp);
    const h = hourBucketLocal(ms);
    if (!buckets.has(h)) buckets.set(h, []);
    buckets.get(h)!.push(r.value);
  }
  const hits = Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([t, vals]) => {
      const nivel = vals.reduce((a, b) => a + b, 0) / vals.length;
      return { label: formatHourLocal(t), nivel: Math.round(nivel * 100) / 100 };
    });
  return hits;
}
