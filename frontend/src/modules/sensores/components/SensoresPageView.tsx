"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SensorsPageHeader } from "@/modules/sensores/components/SensorsPageHeader";
import { SensorBarIndicator } from "@/modules/sensores/components/SensorBarIndicator";
import { SensorGaugeCard } from "@/modules/sensores/components/SensorGaugeCard";
import { SensorHistoryChartLazy } from "@/modules/sensores/components/SensorHistoryChartLazy";
import { SensorComparisonChartLazy } from "@/modules/sensores/components/SensorComparisonChartLazy";
import type { ComparisonLineDef, ComparisonPoint } from "@/modules/sensores/components/SensorComparisonChart";
import { SensorPlainReadingCard } from "@/modules/sensores/components/SensorPlainReadingCard";
import { SensorStatusCompact } from "@/modules/sensores/components/SensorStatusCompact";
import { SensoresEmptyState } from "@/modules/sensores/components/SensoresEmptyState";
import { SensorTechnicalSummary } from "@/modules/sensores/components/SensorTechnicalSummary";
import { isSoilMoistureForIrrigation } from "@/modules/dashboard/lib/irrigationRecommendation";
import {
  inferSensorIconForReading,
  readingToBarItemIfPercentLike,
  readingToGaugeItem
} from "@/modules/sensores/lib/readingPresentation";
import type { SensorReadingResponse } from "@/lib/api/types";
import type { SensorInfoResponse } from "@/lib/api/types";
import {
  fetchDeviceIds,
  fetchLatestReadings,
  fetchReadingsHistory,
  fetchSensorsForDevice
} from "@/lib/api/sensors";
import { historyToChartPoints, isReadingRecent } from "@/modules/dashboard/lib/iotPresentation";
import { formatValueWithUnit } from "@/modules/dashboard/lib/iotPresentation";
import {
  formatSensorHistoryChartSubtitle,
  formatSensorHistoryChartTitle,
  formatSensorTypeTitle,
  getSensorSubtitle
} from "@/shared/lib/sensorDisplay";
import {
  OPEN_METEO_LOCATION_LABEL,
  OPEN_METEO_UNAVAILABLE,
  getOpenMeteoClimateOnly
} from "@/modules/dashboard/data/openMeteoClimate";
import type { SensorBarIndicatorItem, SensorCompactStatusItem, SensorHistorySeries, SensorLevel } from "@/modules/sensores/types";
import type { SensorTechnicalStats } from "@/modules/sensores/types";
import { AppShell } from "@/shared/components/layout/AppShell";
import { IotDeviceSelector } from "@/shared/components/ui/IotDeviceSelector";
import { Card } from "@/shared/components/ui/Card";

const CHART_COLORS = ["#38bdf8", "#22C55E", "#a78bfa", "#f472b6"];
const COMPARISON_COLORS = ["#0ea5e9", "#22c55e", "#a855f7", "#f97316", "#e11d48", "#14b8a6"];
type TimeRangeKey = "24h" | "7d" | "30d" | "custom";
type StatusFilter = "all" | "active" | "inactive";
type CustomDateRange = { from: string; to: string };
type ComparisonCardModel = {
  id: string;
  title: string;
  subtitle: string;
  unit: string;
  lines: ComparisonLineDef[];
  data: ComparisonPoint[];
};

type ComparisonPointsMap = Map<string, Map<string, Map<number, number>>>;

/** Agrupa todas las variantes típicas de humedad de suelo sobre la misma clave API. */
function isSoilMoistureComparableKey(normType: string, rawType: string): boolean {
  const h = `${rawType}`.toLowerCase();
  const n = normType.toLowerCase();
  return n === "soil_moisture" || ((h.includes("soil") || h.includes("suelo")) && (h.includes("moist") || h.includes("mois")));
}

/** Prioridad para la segunda comparativa (0 = mejor). Tipos fuera de la lista llevan mayor número. */
function secondComparisonPriority(normKey: string, rawFromApi: string): number {
  const h = `${rawFromApi}`.toLowerCase();
  const n = normKey.toLowerCase();
  if (isSoilMoistureComparableKey(n, rawFromApi)) return 999;
  if (n === "humidity" || (h.includes("relative_humidity") && !h.includes("soil") && !h.includes("suelo"))) return 0;
  if (n === "temperature" || n === "temp" || h.includes("temperature") || /\btemp\b/.test(h)) return 1;
  if (n === "water_level" || h.includes("water_level") || h.includes("tanque")) return 2;
  if (n === "flow" || h.includes("flow") || h.includes("caudal")) return 3;
  return 4;
}

function collectSoilMoistureTypeKeys(
  byType: ComparisonPointsMap,
  normalizeFn: (s: string) => string,
  rawTypeByNormKey: Map<string, string>
): string[] {
  const soilKeys = new Set<string>();
  for (const k of byType.keys()) {
    const nk = normalizeFn(k);
    const raw = rawTypeByNormKey.get(nk) ?? k;
    if (
      nk === "soil_moisture" ||
      nk.includes("soil_moist") ||
      isSoilMoistureComparableKey(nk, raw) ||
      isSoilMoistureComparableKey(nk, k) ||
      isSoilMoistureForIrrigation(raw, k)
    )
      soilKeys.add(k);
  }
  return Array.from(soilKeys);
}

/** Une varios `type` de humedad de suelo por sensor y bucket temporal (corrige pérdidas por claves divergentes en el backend). */
function mergeSoilMoistureBySensor(byType: ComparisonPointsMap, soilTypeKeys: string[]): Map<string, Map<number, number>> {
  const merged = new Map<string, Map<number, number>>();
  for (const tk of soilTypeKeys) {
    const bySensor = byType.get(tk);
    if (!bySensor) continue;
    for (const [sensorId, buckets] of bySensor) {
      let target = merged.get(sensorId);
      if (!target) {
        target = new Map<number, number>();
        merged.set(sensorId, target);
      }
      for (const [bk, val] of buckets) {
        target.set(bk, val);
      }
    }
  }
  return merged;
}

function formatComparisonBucketLabel(bucketMs: number, timeRange: TimeRangeKey): string {
  const d = new Date(bucketMs);
  if (Number.isNaN(d.getTime())) return "—";
  if (timeRange === "24h") {
    return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  const y = d.getFullYear();
  const cy = new Date().getFullYear();
  const datePart = d.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    ...(y !== cy ? { year: "2-digit" as const } : {})
  });
  const timePart = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${datePart} · ${timePart}`;
}

function pickSecondComparisonTypeKey(
  byType: ComparisonPointsMap,
  normalizeFn: (s: string) => string,
  rawTypeByNormKey: Map<string, string>
): string | null {
  let bestKey: string | null = null;
  let bestPrio = 9999;
  for (const [typeKey, bySensor] of byType.entries()) {
    if ((bySensor?.size ?? 0) < 2) continue;
    const nk = normalizeFn(typeKey);
    const raw = rawTypeByNormKey.get(nk) ?? typeKey;
    const p = secondComparisonPriority(nk, raw);
    if (p >= 500) continue;
    if (p < bestPrio || (p === bestPrio && (bestKey === null || typeKey.localeCompare(bestKey, "es") < 0))) {
      bestPrio = p;
      bestKey = typeKey;
    }
  }
  return bestKey;
}

/** Estados para probabilidad de lluvía (solo presentación Open-Meteo en /sensores). */
function rainPctToLevelCaption(pct: number): { level: SensorLevel; caption: string } {
  const p = Math.max(0, Math.min(100, pct));
  if (p < 30) return { level: "low", caption: "Baja" };
  if (p < 65) return { level: "normal", caption: "Moderada" };
  return { level: "high", caption: "Alta" };
}

/** Estados para humedad relativa (solo presentación Open-Meteo en /sensores). */
function rhPctToLevelCaption(rh: number): { level: SensorLevel; caption: string } {
  const p = Math.max(0, Math.min(100, rh));
  if (p < 35) return { level: "low", caption: "Baja" };
  if (p <= 68) return { level: "normal", caption: "Normal" };
  return { level: "high", caption: "Alta" };
}

export function SensoresPageView() {
  const [deviceIds, setDeviceIds] = useState<string[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [latest, setLatest] = useState<SensorReadingResponse[]>([]);
  const [historyRows, setHistoryRows] = useState<SensorReadingResponse[]>([]);
  const [climate, setClimate] = useState<Awaited<ReturnType<typeof getOpenMeteoClimateOnly>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readingsToday, setReadingsToday] = useState<number | null>(null);
  const [sensorCatalog, setSensorCatalog] = useState<SensorInfoResponse[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<TimeRangeKey>("24h");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [customDateRange, setCustomDateRange] = useState<CustomDateRange>(() => {
    const to = new Date();
    const from = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const asInput = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    return { from: asInput(from), to: asInput(to) };
  });

  const getRangeStartIso = useCallback((range: TimeRangeKey): string => {
    const now = Date.now();
    const ms = range === "24h" ? 24 * 60 * 60 * 1000 : range === "7d" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    return new Date(now - ms).toISOString();
  }, []);

  const resolveRangeIso = useCallback(
    (range: TimeRangeKey, custom: CustomDateRange): { from: string; to: string } => {
      if (range === "24h" || range === "7d" || range === "30d") {
        return { from: getRangeStartIso(range), to: new Date().toISOString() };
      }
      const fromMs = Date.parse(custom.from);
      const toMs = Date.parse(custom.to);
      if (!Number.isNaN(fromMs) && !Number.isNaN(toMs) && fromMs < toMs) {
        return { from: new Date(fromMs).toISOString(), to: new Date(toMs).toISOString() };
      }
      return { from: getRangeStartIso("30d"), to: new Date().toISOString() };
    },
    [getRangeStartIso]
  );

  const bucketMinutesForRange = useCallback((range: TimeRangeKey): number => {
    if (range === "24h") return 15;
    if (range === "7d") return 60;
    return 360;
  }, []);

  const normalizeType = useCallback((raw: string): string => raw.trim().toLowerCase(), []);

  const loadDevices = useCallback(async () => {
    try {
      const ids = await fetchDeviceIds();
      setDeviceIds(ids);
      setDeviceId((prev) => {
        if (prev && ids.includes(prev)) return prev;
        return ids[0] ?? "";
      });
      if (ids.length === 0) setError("No hay dispositivos en el backend.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar dispositivos.");
    }
  }, []);

  const loadClimate = useCallback(async () => {
    try {
      const c = await getOpenMeteoClimateOnly();
      setClimate(c);
    } catch {
      setClimate(null);
    }
  }, []);

  const loadDeviceData = useCallback(async (devId: string) => {
    if (!devId) {
      setLatest([]);
      setHistoryRows([]);
      setReadingsToday(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const sensors = await fetchSensorsForDevice(devId);
      setSensorCatalog(sensors);
      const readings = await fetchLatestReadings(devId);
      setLatest(readings);

      const { from, to } = resolveRangeIso(timeRange, customDateRange);
      const historySize =
        timeRange === "24h" ? 2000 : timeRange === "7d" ? 3500 : timeRange === "30d" ? 5000 : 5000;
      const page24 = await fetchReadingsHistory({
        deviceId: devId,
        from,
        to,
        size: historySize,
        page: 0
      });
      setHistoryRows(page24.content);

      const startDay = new Date();
      startDay.setHours(0, 0, 0, 0);
      const pageToday = await fetchReadingsHistory({
        deviceId: devId,
        from: startDay.toISOString(),
        to: new Date().toISOString(),
        size: 500,
        page: 0
      });
      setReadingsToday(pageToday.totalElements);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar datos IoT.");
      setLatest([]);
      setHistoryRows([]);
      setReadingsToday(null);
      setSensorCatalog([]);
    } finally {
      setLoading(false);
    }
  }, [resolveRangeIso, timeRange, customDateRange]);

  useEffect(() => {
    void loadDevices();
    void loadClimate();
  }, [loadDevices, loadClimate]);

  useEffect(() => {
    if (!deviceId) {
      setLoading(false);
      return;
    }
    void loadDeviceData(deviceId);
  }, [deviceId, loadDeviceData]);

  const deviceTypeOptions = useMemo(() => {
    const byNorm = new Map<string, string>();
    for (const s of sensorCatalog) {
      const v = normalizeType(s.type);
      if (!byNorm.has(v)) byNorm.set(v, s.type);
    }
    for (const r of latest) {
      const v = normalizeType(r.type);
      if (!byNorm.has(v)) byNorm.set(v, r.type);
    }
    return Array.from(byNorm.entries())
      .map(([value, raw]) => ({ value, label: formatSensorTypeTitle(raw) }))
      .sort((a, b) => a.label.localeCompare(b.label, "es"));
  }, [sensorCatalog, latest, normalizeType]);

  useEffect(() => {
    if (typeFilter === "all") return;
    if (!deviceTypeOptions.some((o) => o.value === typeFilter)) setTypeFilter("all");
  }, [deviceId, deviceTypeOptions, typeFilter]);

  const filteredLatest = useMemo(() => {
    return latest.filter((r) => {
      const typeOk = typeFilter === "all" || normalizeType(r.type) === normalizeType(typeFilter);
      const statusOk =
        statusFilter === "all" ||
        (statusFilter === "active" ? isReadingRecent(r.timestamp) : !isReadingRecent(r.timestamp));
      return typeOk && statusOk;
    });
  }, [latest, typeFilter, statusFilter, normalizeType]);

  const sensorIdsInScope = useMemo(() => new Set(filteredLatest.map((r) => r.sensorId)), [filteredLatest]);

  const groupedHistory = useMemo(() => {
    const m = new Map<string, SensorReadingResponse[]>();
    for (const row of historyRows) {
      if (!sensorIdsInScope.has(row.sensorId)) continue;
      const k = row.sensorId;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(row);
    }
    return m;
  }, [historyRows, sensorIdsInScope]);

  const chartSeries = useMemo((): SensorHistorySeries[] => {
    const keys = Array.from(groupedHistory.keys()).slice(0, 6);
    return keys.map((sensorId, idx) => {
      const rows = groupedHistory.get(sensorId) ?? [];
      const first = rows[0];
      const pts = historyToChartPoints(rows).map((p) => ({ hour: p.hour, value: p.value }));
      const metricType = first?.type ?? "sensor";
      return {
        id: sensorId,
        title: formatSensorHistoryChartTitle(metricType),
        subtitle: formatSensorHistoryChartSubtitle(sensorId),
        valueLabel: first?.type ?? "Valor",
        unit: first?.unit ?? "",
        color: CHART_COLORS[idx % CHART_COLORS.length],
        data: pts
      };
    });
  }, [groupedHistory]);

  /** Puntos agrupados para comparativas (todos los tipos presentes en el histórico; sensores del dispositivo en `latest`). */
  const comparisonPointsByDevice = useMemo(() => {
    const minutes = bucketMinutesForRange(timeRange);
    const byType = new Map<string, Map<string, Map<number, number>>>();
    const deviceSensorIds = new Set(latest.map((r) => r.sensorId));
    for (const row of historyRows) {
      if (!deviceSensorIds.has(row.sensorId)) continue;
      if (typeof row.value !== "number" || !Number.isFinite(row.value)) continue;
      const rowType = normalizeType(row.type);
      const bySensor = byType.get(rowType) ?? new Map<string, Map<number, number>>();
      const sensorMap = bySensor.get(row.sensorId) ?? new Map<number, number>();
      const ts = Date.parse(row.timestamp);
      if (Number.isNaN(ts)) continue;
      const bucketMs = Math.floor(ts / (minutes * 60 * 1000)) * (minutes * 60 * 1000);
      sensorMap.set(bucketMs, row.value);
      bySensor.set(row.sensorId, sensorMap);
      byType.set(rowType, bySensor);
    }
    return byType;
  }, [historyRows, latest, bucketMinutesForRange, timeRange, normalizeType]);

  const comparisonRawTypeLookup = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of sensorCatalog) {
      const n = normalizeType(s.type);
      if (!m.has(n)) m.set(n, s.type);
    }
    for (const r of latest) {
      const n = normalizeType(r.type);
      if (!m.has(n)) m.set(n, r.type);
    }
    return m;
  }, [sensorCatalog, latest, normalizeType]);

  const buildComparisonSeriesFromBuckets = useCallback(
    (bySensor: Map<string, Map<number, number>>): { lines: ComparisonLineDef[]; data: ComparisonPoint[] } => {
      const entries = Array.from(bySensor.entries()).slice(0, 6);
      const lines = entries.map(([sensorId], idx) => ({
        key: `s${idx}`,
        name: sensorId,
        color: COMPARISON_COLORS[idx % COMPARISON_COLORS.length]
      }));
      const allBuckets = new Set<number>();
      for (const [, values] of entries) {
        for (const bucket of values.keys()) allBuckets.add(bucket);
      }
      const sortedBuckets = Array.from(allBuckets).sort((a, b) => a - b);
      const data: ComparisonPoint[] = sortedBuckets.map((bucket) => {
        const point: ComparisonPoint = {
          timeLabel: formatComparisonBucketLabel(bucket, timeRange)
        };
        for (let i = 0; i < entries.length; i++) {
          const [, values] = entries[i]!;
          const v = values.get(bucket);
          point[`s${i}`] = typeof v === "number" && Number.isFinite(v) ? v : null;
        }
        return point;
      });
      return { lines, data };
    },
    [timeRange]
  );

  const buildComparisonModel = useCallback(
    (pointsByType: ComparisonPointsMap, typeLookupKey: string) => {
      const norm = normalizeType(typeLookupKey);
      let bySensor = pointsByType.get(typeLookupKey) ?? pointsByType.get(norm);
      if (!bySensor) {
        for (const [k, v] of pointsByType.entries()) {
          if (normalizeType(k) === norm) {
            bySensor = v;
            break;
          }
        }
      }
      if (!bySensor) return { lines: [] as ComparisonLineDef[], data: [] as ComparisonPoint[], unit: "" };
      const { lines, data } = buildComparisonSeriesFromBuckets(bySensor);
      const unit = (
        historyRows.find((r) => normalizeType(r.type) === norm)?.unit ??
        latest.find((r) => normalizeType(r.type) === norm)?.unit ??
        ""
      ).trim();
      return { lines, data, unit };
    },
    [buildComparisonSeriesFromBuckets, historyRows, latest, normalizeType]
  );

  const soilMoistureTypeKeysMerged = useMemo(
    () => collectSoilMoistureTypeKeys(comparisonPointsByDevice, normalizeType, comparisonRawTypeLookup),
    [comparisonPointsByDevice, normalizeType, comparisonRawTypeLookup]
  );

  const soilComparison = useMemo(() => {
    if (!soilMoistureTypeKeysMerged.length)
      return { lines: [] as ComparisonLineDef[], data: [] as ComparisonPoint[], unit: "" };
    const mergedBuckets = mergeSoilMoistureBySensor(comparisonPointsByDevice, soilMoistureTypeKeysMerged);
    if (!mergedBuckets.size)
      return { lines: [] as ComparisonLineDef[], data: [] as ComparisonPoint[], unit: "" };
    const { lines, data } = buildComparisonSeriesFromBuckets(mergedBuckets);
    const soilRef =
      historyRows.find((r) => isSoilMoistureForIrrigation(r.type, r.sensorId)) ??
      latest.find((r) => isSoilMoistureForIrrigation(r.type, r.sensorId));
    const unit = (soilRef?.unit ?? "%").trim() || "%";
    return { lines, data, unit };
  }, [buildComparisonSeriesFromBuckets, comparisonPointsByDevice, soilMoistureTypeKeysMerged, historyRows, latest]);

  const secondComparisonTypeKey = useMemo(
    () => pickSecondComparisonTypeKey(comparisonPointsByDevice, normalizeType, comparisonRawTypeLookup),
    [comparisonPointsByDevice, comparisonRawTypeLookup, normalizeType]
  );

  const secondComparison = useMemo(() => {
    if (!secondComparisonTypeKey) return { lines: [] as ComparisonLineDef[], data: [] as ComparisonPoint[], unit: "" };
    return buildComparisonModel(comparisonPointsByDevice, secondComparisonTypeKey);
  }, [buildComparisonModel, comparisonPointsByDevice, secondComparisonTypeKey]);

  const rangeLabel = useMemo(
    () => (timeRange === "24h" ? "24h" : timeRange === "7d" ? "7d" : timeRange === "30d" ? "30d" : "personalizado"),
    [timeRange]
  );

  const comparisonChartsToShow = useMemo((): ComparisonCardModel[] => {
    const subtitle = "Comparación entre sensores del mismo tipo";
    const out: ComparisonCardModel[] = [];
    const soilHasData =
      soilComparison.lines.length >= 1 && soilComparison.data.length > 0;
    const secondHasComparable =
      secondComparison.lines.length >= 2 && secondComparison.data.length > 0;
    if (soilHasData) {
      out.push({
        id: "soil",
        title: `Comparación de humedad del suelo (${rangeLabel})`,
        subtitle,
        unit: soilComparison.unit || "%",
        lines: soilComparison.lines,
        data: soilComparison.data
      });
    }
    if (secondHasComparable && secondComparisonTypeKey) {
      const raw = comparisonRawTypeLookup.get(normalizeType(secondComparisonTypeKey)) ?? secondComparisonTypeKey;
      out.push({
        id: "second",
        title: `Comparación de ${formatSensorTypeTitle(raw)} (${rangeLabel})`,
        subtitle,
        unit: secondComparison.unit,
        lines: secondComparison.lines,
        data: secondComparison.data
      });
    }
    return out;
  }, [
    soilComparison,
    secondComparison,
    secondComparisonTypeKey,
    comparisonRawTypeLookup,
    normalizeType,
    rangeLabel
  ]);

  const gaugeSensorIds = useMemo(() => {
    const ids = new Set<string>();
    for (const r of filteredLatest) {
      if (readingToGaugeItem(r)) ids.add(r.sensorId);
    }
    return ids;
  }, [filteredLatest]);

  const iotBars = useMemo(() => {
    const out: SensorBarIndicatorItem[] = [];
    for (const r of filteredLatest) {
      if (gaugeSensorIds.has(r.sensorId)) continue;
      const b = readingToBarItemIfPercentLike(r);
      if (b) out.push(b);
    }
    return out;
  }, [filteredLatest, gaugeSensorIds]);

  const meteoOpenMeteoBars = useMemo(() => {
    if (!climate || climate.weather.condition === OPEN_METEO_UNAVAILABLE) return null;
    const w = climate.weather;
    const rain = climate.rainProbabilityNow;
    const rainPct = Math.max(0, Math.min(100, rain));
    const rainState = rainPctToLevelCaption(rainPct);
    const rainItem: SensorBarIndicatorItem = {
      id: "om-rain",
      label: "Probabilidad de lluvia",
      iconKey: "cloud-rain",
      value: rainPct,
      displayValue: `${rainPct}%`,
      min: 0,
      max: 100,
      level: rainState.level,
      caption: rainState.caption
    };
    const rhState = rhPctToLevelCaption(w.relativeHumidity);
    const rhItem: SensorBarIndicatorItem = {
      id: "om-rh",
      label: "Humedad relativa",
      iconKey: "droplets",
      value: w.relativeHumidity,
      displayValue: `${w.relativeHumidity}%`,
      min: 0,
      max: 100,
      level: rhState.level,
      caption: rhState.caption
    };
    const pressureHpa = w.pressureHpa;
    const pressureItem: SensorBarIndicatorItem | null =
      pressureHpa !== undefined && pressureHpa !== null && !Number.isNaN(Number(pressureHpa))
        ? {
            id: "om-p",
            label: "Presión atmosférica",
            iconKey: "gauge",
            value: Number(pressureHpa),
            displayValue: `${Math.round(Number(pressureHpa))} hPa`,
            min: 0,
            max: 1,
            level: "normal",
            showPercentBar: false,
            caption: "Fuente: Open-Meteo"
          }
        : null;

    const elev = climate.elevationMeters;
    const elevationItem: SensorBarIndicatorItem | null =
      elev !== undefined && elev !== null && Number.isFinite(elev)
        ? {
            id: "om-elev",
            label: "Elevación del sitio",
            iconKey: "mountain",
            value: elev,
            displayValue: `${elev} m s.n.m.`,
            min: 0,
            max: 1,
            level: "normal",
            showPercentBar: false,
            caption: "Fuente: Open-Meteo"
          }
        : null;

    return { rainItem, rhItem, pressureItem, elevationItem };
  }, [climate]);

  const technical = useMemo((): SensorTechnicalStats => {
    const disconnected = filteredLatest.filter((r) => !isReadingRecent(r.timestamp)).length;
    return {
      activeSensors: filteredLatest.filter((r) => isReadingRecent(r.timestamp)).length,
      disconnectedSensors: disconnected,
      readingsToday,
      updateFrequency: "No disponible"
    };
  }, [filteredLatest, readingsToday]);

  const compactStatus = useMemo((): SensorCompactStatusItem[] => {
    return filteredLatest.map((r) => ({
      id: r.sensorId,
      title: formatSensorTypeTitle(r.type),
      subtitle: getSensorSubtitle(r.sensorId, r.timestamp),
      iconKey: inferSensorIconForReading(r.type, r.sensorId),
      value: formatValueWithUnit(r.value, r.unit),
      online: isReadingRecent(r.timestamp)
    }));
  }, [filteredLatest]);

  const deviceSelect = <IotDeviceSelector deviceIds={deviceIds} value={deviceId} onChange={setDeviceId} />;
  const hasDeviceSelected = Boolean(deviceId);
  const showFilteredReadings = filteredLatest.length > 0;
  const reorganizeMainSection =
    hasDeviceSelected && !loading && !showFilteredReadings;
  const historicEmptyGlobal =
    hasDeviceSelected && !loading && chartSeries.length === 0;
  const hintFiltersBackend = "Comprueba MQTT, el backend o ajusta los filtros.";
  const controlClass =
    "rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-[10px] font-medium text-slate-900 outline-none transition hover:border-sky-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 dark:border-slate-600/80 dark:bg-[#0f1a2a] dark:text-slate-100 dark:hover:border-slate-500";

  return (
    <AppShell mainClassName="min-h-screen overflow-y-auto overflow-x-hidden">
      <SensorsPageHeader trailing={deviceSelect} />

      <Card padding="sm" className="mb-3">
        <div className="mb-3 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Filtros avanzados</p>
          <p className="text-[10px] leading-snug text-slate-500 dark:text-slate-400">
            Tipo de sensor, rango y estado aplican a las tarjetas y al histórico por sensor en la zona central. Las
            comparativas inferiores usan todas las lecturas del dispositivo en el mismo rango de tiempo cargado desde el backend.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <label className="flex flex-col gap-1 text-[10px] text-slate-500">
            Tipo de sensor
            <select className={controlClass} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">Todos</option>
              {deviceTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[10px] text-slate-500">
            Rango de tiempo
            <select className={controlClass} value={timeRange} onChange={(e) => setTimeRange(e.target.value as TimeRangeKey)}>
              <option value="24h">Últimas 24 horas</option>
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="custom">Personalizado (desde/hasta)</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[10px] text-slate-500">
            Estado
            <select className={controlClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </label>
        </div>
        {timeRange === "custom" ? (
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-[10px] text-slate-500">
              Desde
              <input
                type="datetime-local"
                className={controlClass}
                value={customDateRange.from}
                onChange={(e) => setCustomDateRange((prev) => ({ ...prev, from: e.target.value }))}
              />
            </label>
            <label className="flex flex-col gap-1 text-[10px] text-slate-500">
              Hasta
              <input
                type="datetime-local"
                className={controlClass}
                value={customDateRange.to}
                onChange={(e) => setCustomDateRange((prev) => ({ ...prev, to: e.target.value }))}
              />
            </label>
          </div>
        ) : null}
      </Card>

      {error ? (
        <p className="mb-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-[10px] text-amber-200">{error}</p>
      ) : null}

      <div className="mt-3 grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {loading && hasDeviceSelected
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={`g-sk-${i}`} className="h-[220px] animate-pulse rounded-2xl bg-slate-800/40" />
            ))
          : !showFilteredReadings
            ? hasDeviceSelected ? (
                <SensoresEmptyState
                  variant="banner"
                  className="border-slate-600/45 bg-slate-900/20"
                  title="Sin lecturas IoT para este dispositivo."
                  hint={hintFiltersBackend}
                />
              ) : null
            : filteredLatest.map((r) => {
                const g = readingToGaugeItem(r);
                return g ? <SensorGaugeCard key={r.sensorId} sensor={g} /> : <SensorPlainReadingCard key={r.sensorId} reading={r} />;
              })}
      </div>

      {iotBars.length > 0 ? (
        <div className="mt-2 shrink-0">
          <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500">Barras · sensores IoT (%)</p>
          <div className="grid shrink-0 grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
            {iotBars.map((item) => (
              <SensorBarIndicator key={item.id} item={item} />
            ))}
          </div>
        </div>
      ) : null}

      {meteoOpenMeteoBars ? (
        <div className="mt-3 w-full max-w-none shrink-0">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            CLIMA EXTERNO · {OPEN_METEO_LOCATION_LABEL.toUpperCase()}
          </p>
          <div className="grid w-full grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
            <div className="min-w-0 w-full">
              <SensorBarIndicator key={meteoOpenMeteoBars.rainItem.id} item={meteoOpenMeteoBars.rainItem} />
            </div>
            <div className="min-w-0 w-full">
              <SensorBarIndicator key={meteoOpenMeteoBars.rhItem.id} item={meteoOpenMeteoBars.rhItem} />
            </div>
            <div className="min-w-0 w-full">
              {meteoOpenMeteoBars.pressureItem ? (
                <SensorBarIndicator key={meteoOpenMeteoBars.pressureItem.id} item={meteoOpenMeteoBars.pressureItem} />
              ) : (
                <Card padding="sm" className="flex h-full min-h-[7.25rem] w-full flex-col justify-center gap-1">
                  <p className="text-[11px] font-semibold text-slate-200">Presión atmosférica</p>
                  <p className="text-[10px] font-medium text-slate-500">Fuente: Open-Meteo</p>
                  <p className="text-lg font-semibold text-white">—</p>
                  <p className="text-[10px] leading-snug text-slate-500">Referencia externa · no es sensor IoT</p>
                  <p className="text-[10px] text-slate-500">Sin dato de presión en la respuesta actual.</p>
                </Card>
              )}
            </div>
            <div className="min-w-0 w-full">
              {meteoOpenMeteoBars.elevationItem ? (
                <SensorBarIndicator key={meteoOpenMeteoBars.elevationItem.id} item={meteoOpenMeteoBars.elevationItem} />
              ) : (
                <Card padding="sm" className="flex h-full min-h-[7.25rem] w-full flex-col justify-center gap-1">
                  <p className="text-[11px] font-semibold text-slate-200">Elevación del sitio</p>
                  <p className="text-[10px] font-medium text-slate-500">Fuente: Open-Meteo</p>
                  <p className="text-lg font-semibold text-white">—</p>
                  <p className="text-[10px] leading-snug text-slate-500">Referencia externa · no es sensor IoT</p>
                  <p className="text-[10px] text-slate-500">API de elevación no disponible.</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <section className="mt-4 relative z-0 isolate grid grid-cols-1 gap-5 xl:grid-cols-12 xl:items-stretch xl:gap-6">
        {reorganizeMainSection ? (
          <>
            <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:col-span-12 xl:grid-cols-2">
              <div className="relative min-w-0 flex">
                <div className="min-h-0 w-full">
                  <SensorTechnicalSummary stats={technical} />
                </div>
              </div>
              <div className="relative min-w-0 flex">
                <div className="min-h-0 w-full">
                  <SensorStatusCompact sensors={compactStatus} />
                </div>
              </div>
            </div>
            <div className="min-w-0 xl:col-span-12">
              {historicEmptyGlobal ? (
                <SensoresEmptyState
                  variant="row"
                  className="w-full border-slate-600/45 bg-slate-900/15"
                  title="No se encontraron lecturas históricas para el rango seleccionado."
                  hint={hintFiltersBackend}
                />
              ) : null}
            </div>
          </>
        ) : (
          <>
            <div className="grid min-w-0 grid-cols-1 content-start gap-5 md:grid-cols-2 md:gap-6 xl:col-span-8 xl:items-start">
              {chartSeries.map((series, idx) => (
                <div key={series.id} className="relative min-w-0 overflow-visible pb-1 pt-1">
                  <SensorHistoryChartLazy series={series} mountDelayMs={idx * 120} />
                </div>
              ))}
              {historicEmptyGlobal ? (
                <div className="relative min-w-0 md:col-span-2">
                  <SensoresEmptyState
                    variant="row"
                    className="w-full border-slate-600/45 bg-slate-900/15"
                    title="No se encontraron lecturas históricas para el rango seleccionado."
                    hint={hintFiltersBackend}
                  />
                </div>
              ) : null}
            </div>

            <div className="grid min-h-0 min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:col-span-4 xl:grid-cols-1 xl:items-stretch xl:gap-5 xl:self-start">
              <div className="relative min-w-0 flex">
                <div className="min-h-0 w-full">
                  <SensorTechnicalSummary stats={technical} />
                </div>
              </div>
              <div className="relative min-w-0 flex">
                <div className="min-h-0 w-full">
                  <SensorStatusCompact sensors={compactStatus} />
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {comparisonChartsToShow.length > 0 ? (
        <section
          className={
            comparisonChartsToShow.length === 2
              ? "mt-8 grid min-w-0 grid-cols-1 items-start gap-6 pb-6 sm:grid-cols-2 lg:gap-8"
              : "mt-8 grid min-w-0 grid-cols-1 items-start gap-6 pb-6"
          }
        >
          {comparisonChartsToShow.map((card) => (
            <div key={card.id} className="relative min-w-0 w-full overflow-visible py-1">
              <SensorComparisonChartLazy
                title={card.title}
                subtitle={card.subtitle}
                unit={card.unit}
                lines={card.lines}
                data={card.data}
              />
            </div>
          ))}
        </section>
      ) : null}
    </AppShell>
  );
}
