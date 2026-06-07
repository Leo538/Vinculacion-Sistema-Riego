"use client";

import { useEffect, useRef, useState } from "react";
import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import { buildApiUrl } from "@/lib/api/client";
import type { IrrigationStateResponse } from "@/lib/api/types";

export type IrrigationStateSocketStatus = "idle" | "connecting" | "connected" | "error";

interface UseIrrigationStateSocketOptions {
  deviceId: string;
  onState: (state: IrrigationStateResponse) => void;
  enabled?: boolean;
}

interface UseIrrigationStateSocketResult {
  status: IrrigationStateSocketStatus;
  error: string | null;
}

function buildWebSocketUrl(path: string): string {
  const url = new URL(buildApiUrl(path));
  if (url.protocol === "https:") url.protocol = "wss:";
  if (url.protocol === "http:") url.protocol = "ws:";
  return url.toString();
}

function topicForDevice(deviceId: string): string {
  return `/topic/devices/${deviceId}/riego/estado`;
}

function parseIrrigationState(message: IMessage): IrrigationStateResponse {
  const payload = JSON.parse(message.body) as Partial<IrrigationStateResponse>;
  if (typeof payload.encendido !== "boolean" || typeof payload.modoAutomatico !== "boolean") {
    throw new Error("Payload WebSocket de estado de riego inválido.");
  }
  return payload as IrrigationStateResponse;
}

/**
 * Se suscribe a /topic/devices/{deviceId}/riego/estado, donde el backend empuja
 * el estado del sistema de riego (Mega) cada vez que cambia (ver
 * IrrigationStateService#refreshAndPublish).
 */
export function useIrrigationStateSocket({
  deviceId,
  onState,
  enabled = true
}: UseIrrigationStateSocketOptions): UseIrrigationStateSocketResult {
  const onStateRef = useRef(onState);
  const [status, setStatus] = useState<IrrigationStateSocketStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateRef.current = onState;
  }, [onState]);

  useEffect(() => {
    if (!enabled || !deviceId) {
      setStatus("idle");
      setError(null);
      return;
    }

    let closed = false;
    let subscription: StompSubscription | null = null;
    const topic = topicForDevice(deviceId);

    const client = new Client({
      brokerURL: buildWebSocketUrl("/ws"),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        if (closed) return;
        setStatus("connected");
        setError(null);
        subscription = client.subscribe(topic, (message) => {
          try {
            onStateRef.current(parseIrrigationState(message));
          } catch (e) {
            setStatus("error");
            setError(e instanceof Error ? e.message : "No se pudo procesar el estado de riego.");
          }
        });
      },
      onStompError: (frame) => {
        if (closed) return;
        setStatus("error");
        setError(frame.headers.message || "Error STOMP en la conexión WebSocket.");
      },
      onWebSocketError: () => {
        if (closed) return;
        setStatus("error");
        setError("No se pudo abrir la conexión WebSocket.");
      },
      onWebSocketClose: () => {
        if (closed) return;
        setStatus("connecting");
      }
    });

    setStatus("connecting");
    setError(null);
    client.activate();

    return () => {
      closed = true;
      subscription?.unsubscribe();
      void client.deactivate();
    };
  }, [deviceId, enabled]);

  return { status, error };
}
