"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SensorsPageHeader } from "@/modules/sensores/components/SensorsPageHeader";
import { SensorBarIndicator } from "@/modules/sensores/components/SensorBarIndicator";
import { SensorGaugeCard } from "@/modules/sensores/components/SensorGaugeCard";
import { SensorHistoryChartLazy } from "@/modules/sensores/components/SensorHistoryChartLazy";
import { SensorPlainReadingCard } from "@/modules/sensores/components/SensorPlainReadingCard";
import { SensorStatusCompact } from "@/modules/sensores/components/SensorStatusCompact";
import { SensorTechnicalSummary } from "@/modules/sensores/components/SensorTechnicalSummary";
import {
  inferSensorIconForReading,
  readingToBarItemIfPercentLike,
  readingToGaugeItem
} from "@/modules/sensores/lib/readingPresentation";
import type { SensorReadingResponse } from "@/lib/api/types";
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
      await fetchSensorsForDevice(devId);
      const readings = await fetchLatestReadings(devId);
      setLatest(readings);

      const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const to = new Date().toISOString();
      const page24 = await fetchReadingsHistory({ deviceId: devId, from, to, size: 500, page: 0 });
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
    } finally {
      setLoading(false);
    }
  }, []);

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

  const groupedHistory = useMemo(() => {
    const m = new Map<string, SensorReadingResponse[]>();
    for (const row of historyRows) {
      const k = row.sensorId;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(row);
    }
    return m;
  }, [historyRows]);

  const chartSeries = useMemo((): SensorHistorySeries[] => {
    const keys = Array.from(groupedHistory.keys()).slice(0, 4);
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

  const gaugeSensorIds = useMemo(() => {
    const ids = new Set<string>();
    for (const r of latest) {
      if (readingToGaugeItem(r)) ids.add(r.sensorId);
    }
    return ids;
  }, [latest]);

  const iotBars = useMemo(() => {
    const out: SensorBarIndicatorItem[] = [];
    for (const r of latest) {
      if (gaugeSensorIds.has(r.sensorId)) continue;
      const b = readingToBarItemIfPercentLike(r);
      if (b) out.push(b);
    }
    return out;
  }, [latest, gaugeSensorIds]);

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
    const disconnected = latest.filter((r) => !isReadingRecent(r.timestamp)).length;
    return {
      activeSensors: latest.filter((r) => isReadingRecent(r.timestamp)).length,
      disconnectedSensors: disconnected,
      readingsToday,
      updateFrequency: "No disponible"
    };
  }, [latest, readingsToday]);

  const compactStatus = useMemo((): SensorCompactStatusItem[] => {
    return latest.map((r) => ({
      id: r.sensorId,
      title: formatSensorTypeTitle(r.type),
      subtitle: getSensorSubtitle(r.sensorId, r.timestamp),
      iconKey: inferSensorIconForReading(r.type, r.sensorId),
      value: formatValueWithUnit(r.value, r.unit),
      online: isReadingRecent(r.timestamp)
    }));
  }, [latest]);

  const deviceSelect = <IotDeviceSelector deviceIds={deviceIds} value={deviceId} onChange={setDeviceId} />;

  return (
    <AppShell mainClassName="min-h-screen overflow-y-auto overflow-x-hidden">
      <SensorsPageHeader trailing={deviceSelect} />

      {error ? (
        <p className="mb-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-[10px] text-amber-200">{error}</p>
      ) : null}

      <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {loading && deviceId
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={`g-sk-${i}`} className="h-[220px] animate-pulse rounded-2xl bg-slate-800/40" />
            ))
          : latest.length === 0
            ? (
                <div className="col-span-full rounded-2xl border border-dashed border-slate-600/50 bg-slate-900/30 px-4 py-8 text-center text-[11px] text-slate-500">
                  Sin lecturas IoT para este dispositivo. Comprueba MQTT y el backend.
                </div>
              )
            : latest.map((r) => {
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

      <div className="mt-2 grid min-h-0 flex-1 grid-cols-1 gap-2.5 xl:grid-cols-12">
        <div className="grid min-h-0 grid-cols-1 gap-2.5 md:grid-cols-2 xl:col-span-8">
          {chartSeries.map((series, idx) => (
            <SensorHistoryChartLazy key={series.id} series={series} mountDelayMs={idx * 120} />
          ))}
          {!loading && deviceId && chartSeries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-600/50 bg-slate-900/20 px-3 py-6 text-center text-[10px] text-slate-500">
              Sin series históricas en las últimas 24 h.
            </div>
          ) : null}
        </div>

        <div className="grid min-h-0 grid-cols-1 gap-2.5 md:grid-cols-2 xl:col-span-4 xl:grid-cols-1">
          <SensorTechnicalSummary stats={technical} />
          <SensorStatusCompact sensors={compactStatus} />
        </div>
      </div>
    </AppShell>
  );
}
