import type { OpenMeteoHourlyPoint } from "@/modules/dashboard/data/openMeteoClimate";
import type { ForecastDay } from "@/modules/dashboard/types";
import type { IrrigationAction } from "@/modules/dashboard/types";
import {
  chartBucketMinutesForRangeHours,
  isReadingRecent,
  MIN_IOT_CHART_POINTS,
  parseInstantMs,
  synthesizeSensorChartTimeline
} from "@/modules/dashboard/lib/iotPresentation";
import {
  buildIrrigationRecommendation,
  coerceSensorNumeric,
  isSoilMoistureForIrrigation,
  pickLatestSoilReading
} from "@/modules/dashboard/lib/irrigationRecommendation";
import type { SensorReadingResponse } from "@/lib/api/types";

export const RIEGO_CHART_EMPTY_MESSAGE = "Sin datos para la comparación con los filtros actuales.";

export const RIEGO_EVOLUTION_EMPTY_MESSAGE =
  "No hay suficientes puntos para graficar la evolución. Comprueba lecturas de humedad de suelo (backend) y la disponibilidad de Open‑Meteo en el rango.";

export const MIN_RIEGO_CHART_POINTS = MIN_IOT_CHART_POINTS;

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
  if (rangeKey === "30d") {
    return `${datePart} · ${sensorId}`;
  }
  const timePart = formatHourLocal(tsMs);
  return `${datePart} · ${timePart} · ${sensorId}`;
}

function rangeMsForKey(rangeKey: RiegoTimeRangeKey): number {
  if (rangeKey === "24h") return DAY_MS;
  if (rangeKey === "7d") return 7 * DAY_MS;
  return 30 * DAY_MS;
}

function maxHourlyPointsForRange(rangeMs: number): number {
  if (rangeMs <= DAY_MS) return 24;
  if (rangeMs <= 7 * DAY_MS) return 28;
  return 30;
}

function evolutionBucketMs(rangeKey: RiegoTimeRangeKey): number {
  if (rangeKey === "24h") return 60 * 60 * 1000;
  if (rangeKey === "7d") return 6 * 60 * 60 * 1000;
  return DAY_MS;
}

/** Prob. lluvia por instante: horaria Open‑Meteo o onda suave alrededor del valor actual. */
function rainPctAtInstant(
  hourly: OpenMeteoHourlyPoint[],
  instantMs: number,
  fallbackRainPct: number
): number {
  if (hourly.length) {
    return nearestOpenMeteoRainPct(hourly, new Date(instantMs).toISOString());
  }
  const base = Math.max(0, Math.min(100, Math.round(fallbackRainPct)));
  const phase = (instantMs % DAY_MS) / DAY_MS;
  const wave = Math.sin(phase * Math.PI * 2) * 22 + Math.sin(phase * Math.PI * 5) * 10;
  return Math.max(0, Math.min(100, Math.round(base + wave)));
}

/** Oscila alrededor del ancla IoT para cruzar umbrales 30 % / 60 % (solo relleno visual). */
function soilValueAlongFillTimeline(anchor: number, index: number, total: number): number {
  if (total <= 1) return anchor;
  const p = index / (total - 1);
  const wave = Math.sin(p * Math.PI * 2) * 22 + Math.sin(p * Math.PI * 4.5 + 0.5) * 11;
  return Math.max(8, Math.min(92, Math.round((anchor + wave) * 10) / 10));
}

type EvolutionSoilBucket = { iso: string; value: number; sensorId: string };

function bucketSoilReadingsForEvolution(
  soilsChrono: SensorReadingResponse[],
  rangeKey: RiegoTimeRangeKey
): EvolutionSoilBucket[] {
  const bucketMs = evolutionBucketMs(rangeKey);
  const byBucket = new Map<
    number,
    { sum: number; n: number; iso: string; sensorId: string }
  >();

  for (const r of soilsChrono) {
    const val = coerceSensorNumeric(r.value);
    const ms = parseInstantMs(r.timestamp);
    if (val === null || Number.isNaN(ms)) continue;
    const key = Math.floor(ms / bucketMs) * bucketMs;
    const prev = byBucket.get(key);
    if (!prev) {
      byBucket.set(key, { sum: val, n: 1, iso: r.timestamp, sensorId: r.sensorId });
    } else {
      prev.sum += val;
      prev.n += 1;
      if (ms >= parseInstantMs(prev.iso)) {
        prev.iso = r.timestamp;
        prev.sensorId = r.sensorId;
      }
    }
  }

  return Array.from(byBucket.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => ({
      iso: v.iso,
      value: Math.round((v.sum / v.n) * 10) / 10,
      sensorId: v.sensorId
    }));
}

function subsampleHourlySlots(slots: OpenMeteoHourlyPoint[], max: number): OpenMeteoHourlyPoint[] {
  if (slots.length <= max) return slots;
  const out: OpenMeteoHourlyPoint[] = [];
  const step = (slots.length - 1) / Math.max(1, max - 1);
  for (let i = 0; i < max; i++) {
    const idx = Math.min(slots.length - 1, Math.round(i * step));
    out.push(slots[idx]!);
  }
  return out;
}

/** Rejilla temporal en el rango con prob. lluvia por punto (Open‑Meteo o estimada). */
export function hourlySlotsForEvolution(
  hourly: OpenMeteoHourlyPoint[],
  rangeKey: RiegoTimeRangeKey,
  fallbackRainPct: number
): OpenMeteoHourlyPoint[] {
  const rangeMs = rangeMsForKey(rangeKey);
  const now = Date.now();
  const since = now - rangeMs;
  const bucketMs = evolutionBucketMs(rangeKey);

  const filtered = hourly
    .filter((h) => {
      const t = Date.parse(h.time);
      return !Number.isNaN(t) && t >= since && t <= now;
    })
    .sort((a, b) => Date.parse(a.time) - Date.parse(b.time));

  if (filtered.length >= MIN_RIEGO_CHART_POINTS) {
    return subsampleHourlySlots(filtered, maxHourlyPointsForRange(rangeMs));
  }

  const grid: OpenMeteoHourlyPoint[] = [];
  for (let t = since; t <= now; t += bucketMs) {
    grid.push({
      time: new Date(t).toISOString(),
      rainPct: rainPctAtInstant(hourly, t, fallbackRainPct),
      temperatureC: 0
    });
  }
  return subsampleHourlySlots(grid, maxHourlyPointsForRange(rangeMs));
}

/** Evolución por rejilla temporal + suelo IoT (ancla constante o tendencia estimada en relleno). */
export function buildRecommendationEvolutionFromClimateHourly(
  soilAnchor: SensorReadingResponse,
  hourlySlots: OpenMeteoHourlyPoint[],
  rangeKey: RiegoTimeRangeKey,
  options?: { varySoilFromAnchor?: boolean }
): EvolutionRow[] {
  const baseSoil = coerceSensorNumeric(soilAnchor.value);
  if (baseSoil === null) return [];

  const total = hourlySlots.length;
  const varySoil = options?.varySoilFromAnchor === true;

  return hourlySlots.map((slot, idx) => {
    const ms = Date.parse(slot.time);
    const soilVal = varySoil ? soilValueAlongFillTimeline(baseSoil, idx, total) : baseSoil;
    const dec = buildIrrigationRecommendation({
      soilValue: soilVal,
      rainProbabilityPercent: slot.rainPct,
      hasSoilSensor: true
    });
    return {
      timeLabel: formatEvolutionPointLabel(Number.isNaN(ms) ? Date.now() : ms, soilAnchor.sensorId, rangeKey),
      nivel: irrigationActionToLevel(dec.action),
      accion: dec.action
    };
  });
}

export type EvolutionChartResult = {
  rows: EvolutionRow[];
  usedOpenMeteoHourlyFill: boolean;
  usedSoilLatestFill: boolean;
};

export function buildEvolutionChartData(
  soilsInRange: SensorReadingResponse[],
  hourly: OpenMeteoHourlyPoint[],
  rangeKey: RiegoTimeRangeKey,
  latestSoilAnchor: SensorReadingResponse | null,
  fallbackRainPct: number
): EvolutionChartResult {
  const fromSoils = buildRecommendationEvolution(soilsInRange, hourly, rangeKey);
  if (fromSoils.length >= MIN_RIEGO_CHART_POINTS) {
    return { rows: fromSoils, usedOpenMeteoHourlyFill: false, usedSoilLatestFill: false };
  }

  const rangeMs = rangeMsForKey(rangeKey);
  const slots = hourlySlotsForEvolution(hourly, rangeKey, fallbackRainPct);
  const anchor =
    latestSoilAnchor ??
    (soilsInRange.length ? soilsInRange[soilsInRange.length - 1]! : null);

  if (anchor && slots.length >= MIN_RIEGO_CHART_POINTS) {
    const filled = buildRecommendationEvolutionFromClimateHourly(anchor, slots, rangeKey, {
      varySoilFromAnchor: true
    });
    if (filled.length >= MIN_RIEGO_CHART_POINTS) {
      const hadRealHourly =
        hourly.filter((h) => {
          const t = Date.parse(h.time);
          return !Number.isNaN(t) && t >= Date.now() - rangeMs;
        }).length >= MIN_RIEGO_CHART_POINTS;
      return {
        rows: filled,
        usedOpenMeteoHourlyFill: !hadRealHourly,
        usedSoilLatestFill: soilsInRange.length < MIN_RIEGO_CHART_POINTS
      };
    }
  }

  return { rows: [], usedOpenMeteoHourlyFill: false, usedSoilLatestFill: false };
}

export function buildRecommendationEvolution(
  soilsChrono: SensorReadingResponse[],
  hourly: OpenMeteoHourlyPoint[],
  rangeKey: RiegoTimeRangeKey = "24h"
): EvolutionRow[] {
  const sorted = [...soilsChrono]
    .filter((r) => coerceSensorNumeric(r.value) !== null)
    .sort((a, b) => parseInstantMs(a.timestamp) - parseInstantMs(b.timestamp));

  const buckets =
    rangeKey === "24h" ?
      sorted.map((r) => ({
        iso: r.timestamp,
        value: coerceSensorNumeric(r.value)!,
        sensorId: r.sensorId
      }))
    : bucketSoilReadingsForEvolution(sorted, rangeKey);

  return buckets.map((b) => {
    const rain = nearestOpenMeteoRainPct(hourly, b.iso);
    const dec = buildIrrigationRecommendation({
      soilValue: b.value,
      rainProbabilityPercent: rain,
      hasSoilSensor: true
    });
    return {
      timeLabel: formatEvolutionPointLabel(parseInstantMs(b.iso), b.sensorId, rangeKey),
      nivel: irrigationActionToLevel(dec.action),
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

export type SoilTrendChartResult = {
  rows: SoilTrendRow[];
  filledFromLatestAnchor: boolean;
};

function synthesizeSoilTrendDailyFromAnchor(anchorValue: number, rangeKey: RiegoTimeRangeKey): SoilTrendRow[] {
  const numDays = rangeKey === "7d" ? 7 : rangeKey === "30d" ? 30 : 1;
  const out: SoilTrendRow[] = [];
  for (let d = 0; d < numDays; d++) {
    const t = Date.now() - (numDays - 1 - d) * DAY_MS;
    const wobble = Math.sin((d / 4) * Math.PI) * 1.1;
    const val = Math.max(0, Math.min(100, Math.round((anchorValue + wobble) * 10) / 10));
    const dateLabel = new Date(t).toLocaleDateString("es-ES", {
      weekday: rangeKey === "7d" ? "short" : undefined,
      day: "2-digit",
      month: "short"
    });
    out.push({ dateLabel, valor: val });
  }
  return out;
}

/** Tendencia de suelo con relleno desde última lectura IoT si el histórico en rango es escaso. */
export function buildSoilMoistureTrendFilled(
  historyForSoil: SensorReadingResponse[],
  latestReadings: SensorReadingResponse[],
  rangeKey: RiegoTimeRangeKey,
  rangeMs: number
): SoilTrendChartResult {
  let rows = buildSoilMoistureTrend(historyForSoil, rangeKey, rangeMs);
  if (rows.length >= MIN_RIEGO_CHART_POINTS) {
    return { rows, filledFromLatestAnchor: false };
  }

  const anchor = pickLatestSoilReading(historyForSoil) ?? pickLatestSoilReading(latestReadings);
  const v = anchor ? coerceSensorNumeric(anchor.value) : null;
  if (v === null) {
    return { rows: [], filledFromLatestAnchor: false };
  }

  if (rangeKey === "24h") {
    const bucketMin = chartBucketMinutesForRangeHours(24);
    const points = synthesizeSensorChartTimeline(v, rangeMs, bucketMin);
    const mapped = points.map((p) => ({ dateLabel: p.hour, valor: p.value }));
    if (mapped.length >= MIN_RIEGO_CHART_POINTS) {
      return { rows: mapped, filledFromLatestAnchor: true };
    }
  }

  const daily = synthesizeSoilTrendDailyFromAnchor(v, rangeKey);
  if (daily.length >= MIN_RIEGO_CHART_POINTS) {
    return { rows: daily, filledFromLatestAnchor: true };
  }

  return { rows: [], filledFromLatestAnchor: false };
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
