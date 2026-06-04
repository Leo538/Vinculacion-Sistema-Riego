"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertPanel } from "@/modules/dashboard/components/AlertPanel";
import type { OpenMeteoClimateBundle } from "@/modules/dashboard/data/openMeteoClimate";
import { buildAlertsFromReadingsAndClimate } from "@/modules/dashboard/lib/buildAlertsFromReadingsAndClimate";
import type { SensorReadingResponse } from "@/lib/api/types";
import { fetchDeviceIds, fetchLatestReadings } from "@/lib/api/sensors";
import { TelemetryPageLayout } from "@/shared/components/layout/TelemetryPageLayout";
import { IotDeviceSelector } from "@/shared/components/ui/IotDeviceSelector";
import { mergeLatestReadings, useDeviceReadingsSocket } from "@/shared/hooks/useDeviceReadingsSocket";

export function AlertasPageView({ climate }: { climate: OpenMeteoClimateBundle }) {
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

  const alerts = useMemo(() => buildAlertsFromReadingsAndClimate(latest, climate), [latest, climate]);

  const headerTrailing = (
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
      title="Alertas"
      subtitle="Avisos calculados desde sensores IoT y Open-Meteo (referencia meteorológica)"
      headerTrailing={headerTrailing}
      note="Las reglas aplican sobre las últimas lecturas del dispositivo seleccionado y el clima exterior de Tisaleo. No se usa un endpoint de alertas ni datos simulados."
    >
      {error ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-[10px] text-amber-200">{error}</p>
      ) : null}

      <div className="grid min-h-0 shrink-0 gap-3">
        <AlertPanel alerts={alerts} variant="page" />
      </div>
    </TelemetryPageLayout>
  );
}
