"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { IrrigationRecommendation } from "@/modules/dashboard/components/IrrigationRecommendation";
import type { OpenMeteoClimateBundle } from "@/modules/dashboard/data/openMeteoClimate";
import { OPEN_METEO_UNAVAILABLE, getOpenMeteoClimateOnly } from "@/modules/dashboard/data/openMeteoClimate";
import {
  buildIrrigationRecommendation,
  coerceSensorNumeric,
  pickLatestSoilReading
} from "@/modules/dashboard/lib/irrigationRecommendation";
import type { SensorReadingResponse } from "@/lib/api/types";
import type { SensorInfoResponse } from "@/lib/api/types";
import { fetchDeviceIds, fetchLatestReadings, fetchReadingsHistory, fetchSensorsForDevice } from "@/lib/api/sensors";
import { TelemetryPageLayout } from "@/shared/components/layout/TelemetryPageLayout";
import { IotDeviceSelector } from "@/shared/components/ui/IotDeviceSelector";
import { Card } from "@/shared/components/ui/Card";
import { RiegoChartsPanel } from "@/modules/riego/components/RiegoChartsPanel";
import { formatSensorTypeTitle } from "@/shared/lib/sensorDisplay";
import {
  RIEGO_EVOLUTION_EMPTY_MESSAGE,
  RIEGO_SOIL_TREND_EMPTY_MESSAGE,
  RIEGO_SOIL_TREND_INSUFFICIENT_MESSAGE,
  buildDailyMeteoRecommendation,
  buildEvolutionChartData,
  buildSoilMoistureTrendFilled,
  filterRiegoReadings,
  MIN_RIEGO_CHART_POINTS,
  normalizeTypeKey,
  soilMoistureFromFiltered
} from "@/modules/riego/lib/buildRiegoChartData";

type TimeRangeKey = "24h" | "7d" | "30d";
type StatusFilter = "all" | "active" | "inactive";

const MS_DAY = 24 * 60 * 60 * 1000;

export function RiegoPageView({ climate }: { climate: OpenMeteoClimateBundle }) {
  const [climateLive, setClimateLive] = useState<OpenMeteoClimateBundle>(climate);
  const [deviceIds, setDeviceIds] = useState<string[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [latest, setLatest] = useState<SensorReadingResponse[]>([]);
  const [historyRows, setHistoryRows] = useState<SensorReadingResponse[]>([]);
  const [sensorCatalog, setSensorCatalog] = useState<SensorInfoResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<TimeRangeKey>("24h");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const loadDevices = useCallback(async () => {
    try {
      const ids = await fetchDeviceIds();
      setDeviceIds(ids);
      setDeviceId((prev) => {
        if (prev && ids.includes(prev)) return prev;
        return ids[0] ?? "";
      });
      if (ids.length === 0) setError("No hay dispositivos en el backend.");
      else setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar dispositivos.");
      setDeviceIds([]);
      setDeviceId("");
    }
  }, []);

  const loadLatest = useCallback(async (devId: string) => {
    if (!devId) {
      setLatest([]);
      return;
    }
    try {
      setError(null);
      const readings = await fetchLatestReadings(devId);
      setLatest(readings);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar lecturas IoT.");
      setLatest([]);
    }
  }, []);

  const loadHistoryAndCatalog = useCallback(async (devId: string) => {
    if (!devId) {
      setHistoryRows([]);
      setSensorCatalog([]);
      return;
    }
    setHistoryError(null);
    try {
      const now = Date.now();
      const from = new Date(now - 30 * MS_DAY).toISOString();
      const to = new Date(now).toISOString();
      const [sensors, page] = await Promise.all([
        fetchSensorsForDevice(devId),
        fetchReadingsHistory({ deviceId: devId, from, to, size: 5200, page: 0 })
      ]);
      setSensorCatalog(sensors);
      setHistoryRows(page.content);
    } catch (e) {
      setHistoryError(e instanceof Error ? e.message : "Error al cargar histórico IoT.");
      setHistoryRows([]);
      setSensorCatalog([]);
    }
  }, []);

  useEffect(() => {
    setClimateLive(climate);
  }, [climate]);

  const refreshClimate = useCallback(async () => {
    try {
      const c = await getOpenMeteoClimateOnly();
      setClimateLive(c);
    } catch {
      /* mantiene bundler SSR si falla */
    }
  }, []);

  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  useEffect(() => {
    void refreshClimate();
    const intervalMs = 6 * 60 * 1000;
    const id = window.setInterval(() => {
      void refreshClimate();
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [refreshClimate]);

  useEffect(() => {
    void loadLatest(deviceId);
  }, [deviceId, loadLatest]);

  useEffect(() => {
    void refreshClimate();
  }, [deviceId, refreshClimate]);

  const newestLatestReadingMs = useMemo(() => {
    if (!latest.length) return "";
    let best = "";
    let bestTs = -Infinity;
    for (const r of latest) {
      const ts = Date.parse(r.timestamp);
      if (!Number.isNaN(ts) && ts >= bestTs) {
        bestTs = ts;
        best = r.timestamp;
      }
    }
    return best;
  }, [latest]);

  useEffect(() => {
    if (!deviceId || newestLatestReadingMs === "") return;
    const t = window.setTimeout(() => {
      void refreshClimate();
    }, 380);
    return () => window.clearTimeout(t);
  }, [deviceId, newestLatestReadingMs, refreshClimate]);

  useEffect(() => {
    void loadHistoryAndCatalog(deviceId);
  }, [deviceId, loadHistoryAndCatalog]);

  const deviceTypeOptions = useMemo(() => {
    const byNorm = new Map<string, string>();
    for (const s of sensorCatalog) {
      const v = normalizeTypeKey(s.type);
      if (!byNorm.has(v)) byNorm.set(v, s.type);
    }
    for (const r of latest) {
      const v = normalizeTypeKey(r.type);
      if (!byNorm.has(v)) byNorm.set(v, r.type);
    }
    return Array.from(byNorm.entries())
      .map(([value, raw]) => ({ value, label: formatSensorTypeTitle(raw) }))
      .sort((a, b) => a.label.localeCompare(b.label, "es"));
  }, [sensorCatalog, latest]);

  useEffect(() => {
    if (typeFilter === "all") return;
    if (!deviceTypeOptions.some((o) => o.value === typeFilter)) setTypeFilter("all");
  }, [deviceId, deviceTypeOptions, typeFilter]);

  const filteredReadings = useMemo(
    () => filterRiegoReadings(historyRows, typeFilter, statusFilter, normalizeTypeKey),
    [historyRows, typeFilter, statusFilter]
  );

  /** Histórico de suelo para gráficas: tipo “Todos” para no ocultar humedad por filtro de tipo. */
  const historyForSoilCharts = useMemo(
    () => filterRiegoReadings(historyRows, "all", statusFilter, normalizeTypeKey),
    [historyRows, statusFilter]
  );

  const latestFiltered = useMemo(
    () => filterRiegoReadings(latest, typeFilter, statusFilter, normalizeTypeKey),
    [latest, typeFilter, statusFilter]
  );

  const latestSoilForCharts = useMemo(
    () => pickLatestSoilReading(filterRiegoReadings(latest, "all", statusFilter, normalizeTypeKey)),
    [latest, statusFilter]
  );

  const rangeMs = timeRange === "24h" ? MS_DAY : timeRange === "7d" ? 7 * MS_DAY : 30 * MS_DAY;

  const soilsInRange = useMemo(() => {
    const since = Date.now() - rangeMs;
    return soilMoistureFromFiltered(historyForSoilCharts).filter((r) => Date.parse(r.timestamp) >= since);
  }, [historyForSoilCharts, rangeMs]);

  const hourly = climateLive.hourlyForecast ?? [];

  const evolutionResult = useMemo(() => {
    const rain = coerceSensorNumeric(climateLive.rainProbabilityNow) ?? 0;
    return buildEvolutionChartData(soilsInRange, hourly, timeRange, latestSoilForCharts, rain);
  }, [soilsInRange, hourly, timeRange, latestSoilForCharts, climateLive.rainProbabilityNow]);

  const evolution = evolutionResult.rows;

  const evolutionSubtitleNote = useMemo(() => {
    const parts: string[] = [];
    if (evolutionResult.usedSoilLatestFill) {
      parts.push("tendencia de humedad estimada desde última lectura IoT");
    }
    if (evolutionResult.usedOpenMeteoHourlyFill) {
      parts.push("prob. lluvia horaria extendida desde valor actual Open‑Meteo");
    }
    return parts.length ? ` · ${parts.join(" · ")}` : "";
  }, [evolutionResult.usedSoilLatestFill, evolutionResult.usedOpenMeteoHourlyFill]);

  const weekly = useMemo(() => {
    if (!climateLive.forecast?.length) return [];
    return buildDailyMeteoRecommendation(climateLive.forecast, filteredReadings);
  }, [climateLive.forecast, filteredReadings]);

  const soilTrendResult = useMemo(
    () => buildSoilMoistureTrendFilled(historyForSoilCharts, latest, timeRange, rangeMs),
    [historyForSoilCharts, latest, timeRange, rangeMs]
  );

  const soilTrend = soilTrendResult.rows;

  const soilTrendSubtitleNote = soilTrendResult.filledFromLatestAnchor
    ? " · serie completada desde última lectura IoT (backend)"
    : "";

  const soilTrendInsufficient = soilTrend.length > 0 && soilTrend.length < MIN_RIEGO_CHART_POINTS;
  const openMeteoOk = climateLive.weather.condition !== OPEN_METEO_UNAVAILABLE;

  const irrigation = useMemo(() => {
    if (latest.length === 0) {
      const rain = coerceSensorNumeric(climateLive.rainProbabilityNow) ?? 0;
      return buildIrrigationRecommendation({
        soilValue: null,
        rainProbabilityPercent: Number.isFinite(rain) ? rain : 0,
        hasSoilSensor: false
      });
    }
    if (latestFiltered.length === 0) {
      return {
        action: "Sin dato de suelo" as const,
        suggestedTime: "No disponible",
        reason:
          "Los filtros actualmente excluyen todas las lecturas del dispositivo. Usa “Todos” en tipo y estado para calcular la recomendación desde el último suelo válido."
      };
    }
    const soil = pickLatestSoilReading(latestFiltered);
    const rain = coerceSensorNumeric(climateLive.rainProbabilityNow) ?? 0;
    return buildIrrigationRecommendation({
      soilValue: soil ? coerceSensorNumeric(soil.value) : null,
      rainProbabilityPercent: Number.isFinite(rain) ? rain : 0,
      hasSoilSensor: !!soil
    });
  }, [latest, latestFiltered, climateLive.rainProbabilityNow]);

  const irrigationDataFooter = useMemo(() => {
    if (latest.length === 0) return null;
    if (latestFiltered.length === 0) return null;
    const soil = pickLatestSoilReading(latestFiltered);
    if (!soil) return null;
    const pct = coerceSensorNumeric(soil.value);
    const rain = coerceSensorNumeric(climateLive.rainProbabilityNow);
    const parts: string[] = [];
    if (pct !== null) parts.push(`Humedad de suelo (última según filtros): ${Math.round(pct)}% (${soil.sensorId})`);
    if (rain !== null) parts.push(`Probabilidad lluvia (Open‑Meteo · ahora): ${Math.round(Math.max(0, Math.min(100, rain)))}%`);
    if (!openMeteoOk) parts.push("Clima detallado temporalmente sin Open‑Meteo; la evolución gráfica usa lluvia = 0% si no hay horarias.");
    return parts.length ? parts.join(" · ") : null;
  }, [climateLive.rainProbabilityNow, latest.length, latestFiltered, openMeteoOk]);

  const deviceSelect = <IotDeviceSelector deviceIds={deviceIds} value={deviceId} onChange={setDeviceId} />;

  const controlClass =
    "rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-[10px] font-medium text-slate-900 outline-none transition hover:border-sky-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 dark:border-slate-600/80 dark:bg-[#0f1a2a] dark:text-slate-100 dark:hover:border-slate-500";

  return (
    <TelemetryPageLayout
      title="Riego"
      subtitle="Recomendación IoT + Open‑Meteo (Tisaleo) · gráficas según filtros"
      headerTrailing={deviceSelect}
      wideContent
    >
      {error ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-[10px] text-amber-200">{error}</p>
      ) : null}
      {historyError ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-[10px] text-amber-200">{historyError}</p>
      ) : null}

      <div className="grid shrink-0 gap-4">
        <IrrigationRecommendation irrigation={irrigation} emphasizeAction />
        {irrigationDataFooter ? (
          <p className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[9px] leading-relaxed text-slate-600 shadow-sm dark:border-slate-700/35 dark:bg-[#0f1a2a]/80 dark:text-slate-400 dark:shadow-none">
            {irrigationDataFooter}
          </p>
        ) : null}

        <Card padding="sm">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Filtros de visualización</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex flex-col gap-1 text-[10px] text-slate-500 dark:text-slate-400">
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
            <label className="flex flex-col gap-1 text-[10px] text-slate-500 dark:text-slate-400">
              Rango para evolución (recomendación)
              <select className={controlClass} value={timeRange} onChange={(e) => setTimeRange(e.target.value as TimeRangeKey)}>
                <option value="24h">Últimas 24 horas</option>
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[10px] text-slate-500 dark:text-slate-400">
              Estado
              <select className={controlClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </label>
          </div>
          <p className="mt-2 text-[9px] leading-relaxed text-slate-500">
            Las gráficas de evolución y tendencia usan exactamente el rango elegido aquí en “Rango para evolución”; la zona meteorológica de 7 días sigue siendo el pronóstico Open‑Meteo. El histórico IoT cargado desde el backend cubre 30&nbsp;días (~5200 muestras).
          </p>
        </Card>
      </div>

      <RiegoChartsPanel
        evolution={evolution}
        evolutionRangeKey={timeRange}
        evolutionEmptyMessage={RIEGO_EVOLUTION_EMPTY_MESSAGE}
        evolutionSubtitleNote={evolutionSubtitleNote}
        weekly={weekly}
        soilTrend={soilTrend}
        soilTrendEmptyMessage={RIEGO_SOIL_TREND_EMPTY_MESSAGE}
        soilTrendSubtitleNote={soilTrendSubtitleNote}
        soilTrendInsufficient={soilTrendInsufficient}
        soilTrendInsufficientMessage={RIEGO_SOIL_TREND_INSUFFICIENT_MESSAGE}
      />
    </TelemetryPageLayout>
  );
}
