import { apiGet, apiPost, unwrapData } from "@/lib/api/client";
import type {
  ComandoGateway,
  ComandoRiego,
  DeviceStatusResponse,
  IrrigationStateResponse
} from "@/lib/api/types";

/** Estado del gateway ESP32 (WiFi/MQTT/info del dispositivo), vía MQTT con espera de respuesta. */
export async function fetchDeviceStatus(deviceId: string): Promise<DeviceStatusResponse> {
  const enc = encodeURIComponent(deviceId);
  const r = await apiGet<DeviceStatusResponse>(`/api/v1/devices/${enc}/status`);
  return unwrapData(r);
}

/** Último estado conocido del sistema de riego (Mega): encendido, modo, último comando. */
export async function fetchIrrigationState(deviceId: string): Promise<IrrigationStateResponse> {
  const enc = encodeURIComponent(deviceId);
  const r = await apiGet<IrrigationStateResponse>(`/api/v1/devices/${enc}/riego/estado`);
  return unwrapData(r);
}

/** Envía un comando de control de riego (lo ejecuta el Mega: encender/apagar/modo). */
export async function sendRiegoCommand(deviceId: string, comando: ComandoRiego): Promise<void> {
  const enc = encodeURIComponent(deviceId);
  await apiPost<string>(`/api/v1/devices/${enc}/riego/comando`, { comando });
}

/** Envía un comando de configuración a la propia ESP32 (gateway). */
export async function sendGatewayCommand(deviceId: string, comando: ComandoGateway): Promise<void> {
  const enc = encodeURIComponent(deviceId);
  await apiPost<string>(`/api/v1/devices/${enc}/gateway/comando`, { comando });
}

/** Ordena a la ESP32 borrar su configuración y reiniciar en modo AP. */
export async function resetDevice(deviceId: string): Promise<void> {
  const enc = encodeURIComponent(deviceId);
  await apiPost<string>(`/api/v1/devices/${enc}/reset`);
}

/** Ordena a la ESP32 entrar en modo Access Point sin borrar su configuración. */
export async function enterAPMode(deviceId: string): Promise<void> {
  const enc = encodeURIComponent(deviceId);
  await apiPost<string>(`/api/v1/devices/${enc}/ap`);
}
