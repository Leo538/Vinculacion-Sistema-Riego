"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { IrrigationRecommendation } from "@/modules/dashboard/components/IrrigationRecommendation";
import type { OpenMeteoClimateBundle } from "@/modules/dashboard/data/openMeteoClimate";
import { buildIrrigationRecommendation, pickLatestSoilReading } from "@/modules/dashboard/lib/irrigationRecommendation";
import type { SensorReadingResponse } from "@/lib/api/types";
import { fetchDeviceIds, fetchLatestReadings } from "@/lib/api/sensors";
import { TelemetryPageLayout } from "@/shared/components/layout/TelemetryPageLayout";
import { IotDeviceSelector } from "@/shared/components/ui/IotDeviceSelector";
import { mergeLatestReadings, useDeviceReadingsSocket } from "@/shared/hooks/useDeviceReadingsSocket";

export function RiegoPageView({ climate }: { climate: OpenMeteoClimateBundle }) {
  const [deviceIds, setDeviceIds] = useState<string[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [latest, setLatest] = useState<SensorReadingResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  useEffect(() => {
    void loadLatest(deviceId);
  }, [deviceId, loadLatest]);

  const applyLiveReadings = useCallback((readings: SensorReadingResponse[]) => {
    setLatest((prev) => mergeLatestReadings(prev, readings));
  }, []);

  const socket = useDeviceReadingsSocket({ deviceId, onReadings: applyLiveReadings });

  const irrigation = useMemo(() => {
    const soil = pickLatestSoilReading(latest);
    return buildIrrigationRecommendation({
      soilValue: soil ? soil.value : null,
      rainProbabilityPercent: climate.rainProbabilityNow,
      hasSoilSensor: !!soil
    });
  }, [latest, climate.rainProbabilityNow]);

  const deviceSelect = (
    <IotDeviceSelector
      deviceIds={deviceIds}
      value={deviceId}
      onChange={setDeviceId}
      connectionStatus={socket.status}
      connectionError={socket.error}
    />
  );

  return (
    <TelemetryPageLayout
      title="Riego"
      subtitle="Misma recomendación que el Dashboard (IoT + Open-Meteo, Tisaleo)"
      headerTrailing={deviceSelect}
      note="La probabilidad de lluvia proviene de Open-Meteo. La humedad de suelo usa el sensor IoT más reciente del dispositivo seleccionado (/api/v1/readings/latest)."
    >
      {error ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-[10px] text-amber-200">{error}</p>
      ) : null}

      <div className="grid shrink-0 gap-3">
        <IrrigationRecommendation irrigation={irrigation} />
      </div>
    </TelemetryPageLayout>
  );
}
