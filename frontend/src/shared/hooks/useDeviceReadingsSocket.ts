"use client";

import { useEffect, useRef, useState } from "react";
import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import { buildApiUrl } from "@/lib/api/client";
import type { SensorReadingEvent, SensorReadingResponse } from "@/lib/api/types";

export type DeviceReadingsSocketStatus = "idle" | "connecting" | "connected" | "error";

interface UseDeviceReadingsSocketOptions {
  deviceId: string;
  onReadings: (readings: SensorReadingResponse[], event: SensorReadingEvent) => void;
  enabled?: boolean;
}

interface UseDeviceReadingsSocketResult {
  status: DeviceReadingsSocketStatus;
  error: string | null;
  topic: string;
}

function buildWebSocketUrl(path: string): string {
  const url = new URL(buildApiUrl(path));
  if (url.protocol === "https:") url.protocol = "wss:";
  if (url.protocol === "http:") url.protocol = "ws:";
  return url.toString();
}

function topicForDevice(deviceId: string): string {
  return `/topic/devices/${deviceId}/readings`;
}

function parseSensorReadingEvent(message: IMessage): SensorReadingEvent {
  const payload = JSON.parse(message.body) as Partial<SensorReadingEvent>;
  if (typeof payload.deviceId !== "string" || !Array.isArray(payload.readings)) {
    throw new Error("Payload WebSocket inválido.");
  }
  return payload as SensorReadingEvent;
}

function isSameOrNewerReading(next: SensorReadingResponse, current: SensorReadingResponse): boolean {
  const nextTime = Date.parse(next.timestamp);
  const currentTime = Date.parse(current.timestamp);
  if (Number.isNaN(nextTime) || Number.isNaN(currentTime)) return true;
  return nextTime >= currentTime;
}

export function mergeLatestReadings(
  current: SensorReadingResponse[],
  incoming: SensorReadingResponse[]
): SensorReadingResponse[] {
  if (incoming.length === 0) return current;
  if (current.length === 0) return incoming;

  const incomingBySensor = new Map(incoming.map((reading) => [reading.sensorId, reading]));
  const existingSensorIds = new Set(current.map((reading) => reading.sensorId));

  const merged = current.map((reading) => {
    const next = incomingBySensor.get(reading.sensorId);
    return next && isSameOrNewerReading(next, reading) ? next : reading;
  });

  for (const reading of incoming) {
    if (!existingSensorIds.has(reading.sensorId)) {
      merged.push(reading);
    }
  }

  return merged;
}

export function useDeviceReadingsSocket({
  deviceId,
  onReadings,
  enabled = true
}: UseDeviceReadingsSocketOptions): UseDeviceReadingsSocketResult {
  const onReadingsRef = useRef(onReadings);
  const [status, setStatus] = useState<DeviceReadingsSocketStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onReadingsRef.current = onReadings;
  }, [onReadings]);

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
            const event = parseSensorReadingEvent(message);
            if (event.deviceId !== deviceId) return;
            onReadingsRef.current(event.readings, event);
          } catch (e) {
            setStatus("error");
            setError(e instanceof Error ? e.message : "No se pudo procesar el evento WebSocket.");
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

  return {
    status,
    error,
    topic: deviceId ? topicForDevice(deviceId) : ""
  };
}
