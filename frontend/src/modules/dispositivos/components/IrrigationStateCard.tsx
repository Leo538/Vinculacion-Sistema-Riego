"use client";

import { useCallback, useEffect, useState } from "react";
import { Droplets, Power, Radio } from "lucide-react";
import { fetchIrrigationState } from "@/lib/api/devices";
import type { IrrigationStateResponse } from "@/lib/api/types";
import { Card } from "@/shared/components/ui/Card";
import { useIrrigationStateSocket } from "@/shared/hooks";
import { formatDateTime } from "@/shared/utils/formatters";

const COMANDO_LABELS: Record<string, string> = {
  E: "Encender (manual)",
  A: "Apagar (manual)",
  M: "Cambiar a modo manual",
  U: "Cambiar a modo automático",
  DESCONOCIDO: "Desconocido"
};

/**
 * Estado del sistema de riego (Arduino Mega): encendido/apagado, modo y
 * último comando recibido. A diferencia del estado del gateway, esto SÍ
 * fluye como streaming continuo (la Mega lo agrega a su paquete cada
 * segundo, ver mega.txt), así que aquí no hace falta pedirlo: se carga una
 * vez por REST y luego se mantiene en vivo por WebSocket
 * (/topic/devices/{deviceId}/riego/estado, ver IrrigationStateService).
 */
export function IrrigationStateCard({ deviceId }: { deviceId: string }) {
  const [state, setState] = useState<IrrigationStateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadInitial = useCallback(async (devId: string) => {
    if (!devId) {
      setState(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setState(await fetchIrrigationState(devId));
    } catch (e) {
      setState(null);
      setError(e instanceof Error ? e.message : "Aún no hay estado de riego registrado para este dispositivo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInitial(deviceId);
  }, [deviceId, loadInitial]);

  const socket = useIrrigationStateSocket({
    deviceId,
    onState: (next) => {
      setState(next);
      setError(null);
    }
  });

  const comandoLabel = state ? COMANDO_LABELS[state.ultimoComando] ?? state.ultimoComando : "—";

  return (
    <Card padding="sm" className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Estado del sistema de riego (Mega)</p>
          <p className="text-[9px] text-slate-400">
            {state ? `Reportado ${formatDateTime(new Date(state.timestamp))}` : "En vivo vía MQTT/WebSocket"}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
            socket.status === "connected"
              ? "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200"
              : socket.status === "connecting"
                ? "border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200"
                : "border-slate-300 bg-slate-200 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
          }`}
          title={socket.error ?? undefined}
        >
          <Radio className="size-3" strokeWidth={1.6} />
          {socket.status === "connected" ? "En vivo" : socket.status === "connecting" ? "Conectando" : "Sin conexión"}
        </span>
      </div>

      {error ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-[10px] text-amber-700 dark:text-amber-200">{error}</p>
      ) : null}

      {state ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 dark:border-slate-700/40 dark:bg-[#0f1a2a]">
            <div className="mb-1 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
              <Power className="size-3" strokeWidth={1.6} /> Riego
            </div>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                state.encendido
                  ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                  : "border-slate-400/35 bg-slate-400/10 text-slate-600 dark:text-slate-300"
              }`}
            >
              {state.encendido ? "Encendido" : "Apagado"}
            </span>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 dark:border-slate-700/40 dark:bg-[#0f1a2a]">
            <div className="mb-1 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
              <Droplets className="size-3" strokeWidth={1.6} /> Modo
            </div>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                state.modoAutomatico
                  ? "border-sky-500/35 bg-sky-500/10 text-sky-600 dark:text-sky-300"
                  : "border-amber-500/35 bg-amber-500/10 text-amber-600 dark:text-amber-300"
              }`}
            >
              {state.modoAutomatico ? "Automático" : "Manual"}
            </span>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 dark:border-slate-700/40 dark:bg-[#0f1a2a]">
            <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500">Último comando</p>
            <p className="truncate text-[10px] text-slate-700 dark:text-slate-300">{comandoLabel}</p>
          </div>
        </div>
      ) : !error && !loading ? (
        <p className="text-[10px] text-slate-400">Esperando la primera lectura de estado del dispositivo…</p>
      ) : null}
    </Card>
  );
}
