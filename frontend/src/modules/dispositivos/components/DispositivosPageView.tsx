"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchDeviceIds } from "@/lib/api/sensors";
import { TelemetryPageLayout } from "@/shared/components/layout/TelemetryPageLayout";
import { IotDeviceSelector } from "@/shared/components/ui/IotDeviceSelector";
import { DeviceCommandPanel } from "@/modules/dispositivos/components/DeviceCommandPanel";
import { DeviceStatusCard } from "@/modules/dispositivos/components/DeviceStatusCard";
import { IrrigationStateCard } from "@/modules/dispositivos/components/IrrigationStateCard";

export function DispositivosPageView() {
  const [deviceIds, setDeviceIds] = useState<string[]>([]);
  const [deviceId, setDeviceId] = useState("");
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

  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  const headerTrailing = <IotDeviceSelector deviceIds={deviceIds} value={deviceId} onChange={setDeviceId} />;

  return (
    <TelemetryPageLayout
      title="Dispositivos"
      subtitle="Estado de los gateways ESP32 y del sistema de riego (Mega) · configuración y comandos por MQTT"
      headerTrailing={headerTrailing}
      wideContent
    >
      {error ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-[10px] text-amber-200">{error}</p>
      ) : null}

      {!deviceId ? (
        <p className="text-[10px] text-slate-400">Selecciona un dispositivo para ver su estado y enviarle comandos.</p>
      ) : (
        <div className="grid gap-3">
          <IrrigationStateCard deviceId={deviceId} />
          <DeviceStatusCard deviceId={deviceId} />
          <DeviceCommandPanel deviceId={deviceId} />
        </div>
      )}
    </TelemetryPageLayout>
  );
}
