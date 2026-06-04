"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertPanel } from "@/modules/dashboard/components/AlertPanel";
import { ChartPanel } from "@/modules/dashboard/components/ChartPanel";
import { ForecastPanel } from "@/modules/dashboard/components/ForecastPanel";
import { IrrigationRecommendation } from "@/modules/dashboard/components/IrrigationRecommendation";
import { SensorPanel } from "@/modules/dashboard/components/SensorPanel";
import { SummaryCard } from "@/modules/dashboard/components/SummaryCard";
import { WeatherPanel } from "@/modules/dashboard/components/WeatherPanel";
import type { OpenMeteoClimateBundle } from "@/modules/dashboard/data/openMeteoClimate";
import {
  buildSensorChartPoints,
  CHART_WINDOW_PRESETS,
  chartBucketMinutesForRangeHours,
  chartSubtitleWithBucket,
  DEFAULT_IOT_CHART_RANGE_HOURS,
  DEFAULT_IOT_CHART_RANGE_MS,
  isSoilMoistureCandidate,
  MIN_IOT_CHART_POINTS,
  pickSoilSensorId,
  readingToDashboardSensorRow,
  readingToSummaryMetric,
  selectTopSummaryReadings
} from "@/modules/dashboard/lib/iotPresentation";
import { buildAlertsFromReadingsAndClimate } from "@/modules/dashboard/lib/buildAlertsFromReadingsAndClimate";
import { buildIrrigationRecommendation, pickLatestSoilReading } from "@/modules/dashboard/lib/irrigationRecommendation";
import type { SensorReadingResponse } from "@/lib/api/types";
import { fetchDeviceIds, fetchLatestReadings, fetchReadingsHistory } from "@/lib/api/sensors";
import type { SoilHumidityPoint } from "@/modules/dashboard/types";
import { AppShell } from "@/shared/components/layout/AppShell";
import { IotDeviceSelector } from "@/shared/components/ui/IotDeviceSelector";
import { LivePageHeader } from "@/shared/components/ui/LivePageHeader";
import { formatChartTooltipMetricLabel } from "@/shared/lib/sensorDisplay";
import { Card } from "@/shared/components/ui/Card";

export function DashboardPageView({ climate }: { climate: OpenMeteoClimateBundle }) {
  const [deviceIds, setDeviceIds] = useState<string[]>([]);
  const [deviceId, setDeviceId] = useState<string>("");
  const [latest, setLatest] = useState<SensorReadingResponse[]>([]);
  const [chartPoints, setChartPoints] = useState<SoilHumidityPoint[]>([]);
  const [chartTitle, setChartTitle] = useState(`Histórico IoT (${DEFAULT_IOT_CHART_RANGE_HOURS} h)`);
  const [chartSubtitle, setChartSubtitle] = useState(`Últimas ${DEFAULT_IOT_CHART_RANGE_HOURS} h · sensor prioritario`);
  const [chartValueLabel, setChartValueLabel] = useState("Valor");
  const [chartUnit, setChartUnit] = useState("%");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDevices = useCallback(async () => {
    try {
      const ids = await fetchDeviceIds();
      setDeviceIds(ids);
      setDeviceId((prev) => {
        if (prev && ids.includes(prev)) return prev;
        return ids[0] ?? "";
      });
      if (ids.length === 0) {
        setError("No hay dispositivos registrados en el backend.");
      } else {
        setError(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar la lista de dispositivos.");
      setDeviceIds([]);
      setDeviceId("");
    }
  }, []);

  const loadReadings = useCallback(
    async (devId: string) => {
      if (!devId) {
        setLatest([]);
        setChartPoints([]);
        setChartTitle(`Histórico IoT (${DEFAULT_IOT_CHART_RANGE_HOURS} h)`);
        setChartSubtitle("Selecciona un dispositivo con datos.");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const readings = await fetchLatestReadings(devId);
        setLatest(readings);

        const soilSid = pickSoilSensorId(readings);
        const targetSid = soilSid ?? readings[0]?.sensorId;
        if (targetSid) {
          let pts: SoilHumidityPoint[] = [];
          let chartHours = DEFAULT_IOT_CHART_RANGE_HOURS;
          let bucketMinutes = chartBucketMinutesForRangeHours(DEFAULT_IOT_CHART_RANGE_HOURS);
          let filledFromLatest = false;
          let lastHistory: SensorReadingResponse[] = [];
          const meta = readings.find((r) => r.sensorId === targetSid);

          for (const preset of CHART_WINDOW_PRESETS) {
            const rangeMs = preset.hours * 60 * 60 * 1000;
            const from = new Date(Date.now() - rangeMs).toISOString();
            const to = new Date().toISOString();

            let historyContent: SensorReadingResponse[] = [];
            const pageSize = preset.hours >= 48 ? 2500 : 800;
            const pageBySensor = await fetchReadingsHistory({
              deviceId: devId,
              sensorId: targetSid,
              from,
              to,
              size: pageSize,
              page: 0
            });
            historyContent = pageBySensor.content;
            if (historyContent.length === 0) {
              const pageDevice = await fetchReadingsHistory({
                deviceId: devId,
                from,
                to,
                size: pageSize,
                page: 0
              });
              historyContent = pageDevice.content.filter((r) => r.sensorId === targetSid);
            }
            lastHistory = historyContent;

            const built = buildSensorChartPoints(historyContent, rangeMs, preset.bucketMinutes, meta);
            if (built.points.length >= MIN_IOT_CHART_POINTS) {
              pts = built.points;
              chartHours = preset.hours;
              bucketMinutes = preset.bucketMinutes;
              filledFromLatest = built.filledFromLatestAnchor;
              break;
            }
          }

          if (pts.length < MIN_IOT_CHART_POINTS && meta) {
            const built = buildSensorChartPoints(
              lastHistory,
              DEFAULT_IOT_CHART_RANGE_MS,
              chartBucketMinutesForRangeHours(DEFAULT_IOT_CHART_RANGE_HOURS),
              meta
            );
            pts = built.points;
            filledFromLatest = built.filledFromLatestAnchor;
            chartHours = DEFAULT_IOT_CHART_RANGE_HOURS;
            bucketMinutes = chartBucketMinutesForRangeHours(DEFAULT_IOT_CHART_RANGE_HOURS);
          }

          setChartPoints(pts);
          const isSoil = meta && isSoilMoistureCandidate(meta.type, meta.sensorId);
          setChartTitle(
            isSoil
              ? `Humedad / suelo · ${meta.sensorId} (${chartHours} h)`
              : `Histórico · ${meta?.sensorId ?? targetSid} (${chartHours} h)`
          );
          setChartSubtitle(chartSubtitleWithBucket(bucketMinutes, filledFromLatest));
          setChartValueLabel(formatChartTooltipMetricLabel(meta?.type ?? "Valor"));
          setChartUnit(meta?.unit?.trim() || "");
        } else {
          setChartPoints([]);
          setChartTitle(`Histórico IoT (${DEFAULT_IOT_CHART_RANGE_HOURS} h)`);
          setChartSubtitle("Sin sensores en la última lectura.");
          setChartValueLabel("Valor");
          setChartUnit("");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar lecturas IoT.");
        setLatest([]);
        setChartPoints([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  useEffect(() => {
    if (!deviceId) {
      setLoading(false);
      return;
    }
    void loadReadings(deviceId);
  }, [deviceId, loadReadings]);

  const summaryMetrics = useMemo(
    () => selectTopSummaryReadings(latest, 4).map(readingToSummaryMetric),
    [latest]
  );

  const sensorRows = useMemo(() => latest.map(readingToDashboardSensorRow), [latest]);

  const irrigation = useMemo(() => {
    const soil = pickLatestSoilReading(latest);
    return buildIrrigationRecommendation({
      soilValue: soil ? soil.value : null,
      rainProbabilityPercent: climate.rainProbabilityNow,
      hasSoilSensor: !!soil
    });
  }, [latest, climate.rainProbabilityNow]);

  const alerts = useMemo(() => buildAlertsFromReadingsAndClimate(latest, climate), [latest, climate]);

  const deviceSelect = (
    <IotDeviceSelector deviceIds={deviceIds} value={deviceId} onChange={setDeviceId} />
  );

  return (
    <AppShell mainClassName="overflow-hidden">
      <LivePageHeader
        title="Dashboard"
        subtitle="IoT (Spring Boot) + clima externo (Open-Meteo)"
        trailing={deviceSelect}
      />

      {error ? (
        <p className="mb-2 shrink-0 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-[10px] text-amber-200">
          {error}
        </p>
      ) : null}

      <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {loading && deviceId ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={`sk-${i}`} padding="sm" className="h-[5.25rem] animate-pulse bg-slate-800/40">
                &nbsp;
              </Card>
            ))}
          </>
        ) : summaryMetrics.length === 0 ? (
          <Card padding="sm" className="col-span-full flex min-h-[5.25rem] items-center justify-center">
            <p className="text-center text-[10px] text-slate-500">
              {deviceId
                ? "Sin lecturas recientes para este dispositivo. Verifica MQTT y el backend."
                : "Selecciona un dispositivo o registra datos en el backend."}
            </p>
          </Card>
        ) : (
          summaryMetrics.map((metric) => <SummaryCard key={metric.id} metric={metric} />)
        )}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,34%)_minmax(0,1fr)] lg:gap-4">
        <WeatherPanel weather={climate.weather} />
        <ForecastPanel forecast={climate.forecast} />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-4">
        <div className="min-h-0 lg:col-span-5">
          <ChartPanel
            title={chartTitle}
            subtitle={chartSubtitle}
            data={chartPoints}
            valueLabel={chartValueLabel}
            valueUnit={chartUnit}
          />
        </div>
        <div className="min-h-0 lg:col-span-4">
          <SensorPanel sensors={sensorRows} />
        </div>
        <div className="flex min-h-0 flex-col gap-3 lg:col-span-3">
          <IrrigationRecommendation irrigation={irrigation} />
          <AlertPanel alerts={alerts} variant="embedded" />
        </div>
      </div>
    </AppShell>
  );
}
