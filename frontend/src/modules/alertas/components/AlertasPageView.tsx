"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertPageMonitor } from "@/modules/alertas/components/AlertPageMonitor";
import { buildAlertPageSlots } from "@/modules/alertas/lib/buildAlertPageSlots";
import type { OpenMeteoClimateBundle } from "@/modules/dashboard/data/openMeteoClimate";
import { getOpenMeteoClimateOnly } from "@/modules/dashboard/data/openMeteoClimate";
import type { SensorReadingResponse } from "@/lib/api/types";
import { fetchDeviceIds, fetchLatestReadings } from "@/lib/api/sensors";
import { TelemetryPageLayout } from "@/shared/components/layout/TelemetryPageLayout";
import { IotDeviceSelector } from "@/shared/components/ui/IotDeviceSelector";

export function AlertasPageView({ climate }: { climate: OpenMeteoClimateBundle }) {
  const [deviceIds, setDeviceIds] = useState<string[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [latest, setLatest] = useState<SensorReadingResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [climateLive, setClimateLive] = useState<OpenMeteoClimateBundle>(climate);

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
    void refreshClimate();
    const ms = 6 * 60 * 1000;
    const id = window.setInterval(() => {
      void refreshClimate();
    }, ms);
    return () => window.clearInterval(id);
  }, [deviceId, refreshClimate]);

  const alertSlots = useMemo(() => buildAlertPageSlots(latest, climateLive), [latest, climateLive]);

  const headerTrailing = <IotDeviceSelector deviceIds={deviceIds} value={deviceId} onChange={setDeviceId} />;

  return (
    <TelemetryPageLayout
      title="Alertas"
      subtitle="Monitores con umbrales sobre lecturas IoT (Spring Boot/API) y clima vivo de Open‑Meteo"
      headerTrailing={headerTrailing}
      wideContent
      note="Cada vigilancia se basa en las últimas lecturas del dispositivo seleccionado y el modelo Open‑Meteo (Tisaleo, Ecuador). La humedad exterior, la probabilidad de lluvia y la presión provienen de Open‑Meteo; la humedad de suelo, del backend vía MQTT."
    >
      {error ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-[10px] text-amber-200">{error}</p>
      ) : null}

      <AlertPageMonitor slots={alertSlots} />
    </TelemetryPageLayout>
  );
}
