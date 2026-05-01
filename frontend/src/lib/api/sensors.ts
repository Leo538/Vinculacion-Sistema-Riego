import { apiGet, unwrapData } from "@/lib/api/client";
import type { Page, SensorInfoResponse, SensorReadingResponse, SensorStatsResponse } from "@/lib/api/types";

export async function fetchDeviceIds(): Promise<string[]> {
  const r = await apiGet<string[]>("/api/v1/devices");
  return unwrapData(r);
}

export async function fetchSensorsForDevice(deviceId: string): Promise<SensorInfoResponse[]> {
  const enc = encodeURIComponent(deviceId);
  const r = await apiGet<SensorInfoResponse[]>(`/api/v1/devices/${enc}/sensors`);
  return unwrapData(r);
}

export async function fetchLatestReadings(deviceId: string): Promise<SensorReadingResponse[]> {
  const enc = encodeURIComponent(deviceId);
  const r = await apiGet<SensorReadingResponse[]>(`/api/v1/readings/latest?deviceId=${enc}`);
  return unwrapData(r);
}

export interface HistoryParams {
  deviceId?: string;
  sensorId?: string;
  type?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export async function fetchReadingsHistory(params: HistoryParams): Promise<Page<SensorReadingResponse>> {
  const q = new URLSearchParams();
  if (params.deviceId) q.set("deviceId", params.deviceId);
  if (params.sensorId) q.set("sensorId", params.sensorId);
  if (params.type) q.set("type", params.type);
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  q.set("page", String(params.page ?? 0));
  q.set("size", String(params.size ?? 500));
  const r = await apiGet<Page<SensorReadingResponse>>(`/api/v1/readings/history?${q.toString()}`);
  return unwrapData(r);
}

export interface StatsParams {
  deviceId: string;
  sensorId?: string;
  from?: string;
  to?: string;
}

export async function fetchReadingsStats(params: StatsParams): Promise<SensorStatsResponse[]> {
  const q = new URLSearchParams();
  q.set("deviceId", params.deviceId);
  if (params.sensorId) q.set("sensorId", params.sensorId);
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  const r = await apiGet<SensorStatsResponse[]>(`/api/v1/readings/stats?${q.toString()}`);
  return unwrapData(r);
}
