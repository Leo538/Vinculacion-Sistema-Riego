"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { fetchDeviceStatus } from "@/lib/api/devices";
import type { DeviceStatusResponse } from "@/lib/api/types";
import { Card } from "@/shared/components/ui/Card";
import { formatDateTime } from "@/shared/utils/formatters";

function formatUptime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function Badge({ ok, onLabel, offLabel }: { ok: boolean; onLabel: string; offLabel: string }) {
  const cls = ok
    ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
    : "border-rose-500/35 bg-rose-500/10 text-rose-600 dark:text-rose-300";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      {ok ? <Wifi className="size-3" strokeWidth={1.6} /> : <WifiOff className="size-3" strokeWidth={1.6} />}
      {ok ? onLabel : offLabel}
    </span>
  );
}

/**
 * Estado del gateway ESP32 (WiFi/MQTT/info del dispositivo).
 *
 * A diferencia de las lecturas de sensores (streaming continuo), esto se pide
 * bajo demanda: el backend publica el comando STATUS por MQTT y espera la
 * respuesta del dispositivo (hasta 5s, ver IrrigationService.getDeviceStatus).
 * Por eso es un botón de "Actualizar" y no un polling automático.
 */
export function DeviceStatusCard({ deviceId }: { deviceId: string }) {
  const [status, setStatus] = useState<DeviceStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    if (!deviceId) return;
    setLoading(true);
    setError(null);
    try {
      const s = await fetchDeviceStatus(deviceId);
      setStatus(s);
      setFetchedAt(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo obtener el estado del dispositivo.");
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    setStatus(null);
    setError(null);
    setFetchedAt(null);
  }, [deviceId]);

  return (
    <Card padding="sm" className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Estado del gateway (ESP32)</p>
          <p className="text-[9px] text-slate-400">
            {fetchedAt ? `Consultado ${formatDateTime(fetchedAt)}` : "Pide el estado actual al dispositivo por MQTT"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={!deviceId || loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/10 px-2.5 py-1.5 text-[10px] font-semibold text-sky-700 transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-sky-300"
        >
          <RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} strokeWidth={1.8} />
          {loading ? "Consultando…" : "Actualizar estado"}
        </button>
      </div>

      {error ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-[10px] text-amber-700 dark:text-amber-200">{error}</p>
      ) : null}

      {status ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 dark:border-slate-700/40 dark:bg-[#0f1a2a]">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">WiFi</span>
              <Badge ok={status.wifi.connected} onLabel="Conectado" offLabel="Desconectado" />
            </div>
            <p className="truncate text-[10px] text-slate-700 dark:text-slate-300">SSID: {status.wifi.ssid || "—"}</p>
            <p className="truncate text-[10px] text-slate-700 dark:text-slate-300">IP: {status.wifi.ip || "—"}</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 dark:border-slate-700/40 dark:bg-[#0f1a2a]">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">MQTT</span>
              <Badge ok={status.mqtt.connected} onLabel="Conectado" offLabel="Desconectado" />
            </div>
            <p className="truncate text-[10px] text-slate-700 dark:text-slate-300">{status.mqtt.host}:{status.mqtt.port}</p>
            <p className="truncate text-[10px] text-slate-700 dark:text-slate-300">Topic: {status.mqtt.topic}</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 dark:border-slate-700/40 dark:bg-[#0f1a2a]">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Dispositivo</span>
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                  status.device.ap_mode
                    ? "border-amber-500/35 bg-amber-500/10 text-amber-600 dark:text-amber-300"
                    : "border-emerald-500/35 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                }`}
              >
                {status.device.ap_mode ? "Modo AP" : "Modo estación"}
              </span>
            </div>
            <p className="truncate text-[10px] text-slate-700 dark:text-slate-300">ID: {status.device.id}</p>
            <p className="truncate text-[10px] text-slate-700 dark:text-slate-300">Encendido hace: {formatUptime(status.device.uptime_ms)}</p>
          </div>
        </div>
      ) : !error && !loading ? (
        <p className="text-[10px] text-slate-400">Sin datos todavía. Pulsa “Actualizar estado” para consultar al dispositivo.</p>
      ) : null}
    </Card>
  );
}
