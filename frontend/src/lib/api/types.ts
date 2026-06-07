/** Alineado con el backend Spring: com.uta.iot_backend.sensor.dto.ApiResponse */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  timestamp: string;
}

export interface SensorReadingResponse {
  id: string;
  deviceId: string;
  sensorId: string;
  type: string;
  value: number;
  unit: string;
  timestamp: string;
}

export interface SensorReadingEvent {
  deviceId: string;
  timestamp: string;
  readings: SensorReadingResponse[];
}

export interface SensorInfoResponse {
  sensorId: string;
  type: string;
  unit: string;
}

export interface SensorStatsResponse {
  sensorId: string;
  type: string;
  unit: string;
  min: number;
  max: number;
  avg: number;
  count: number;
}

/** Spring Data Page<SensorReadingResponse> serializado en JSON */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/** Comandos del sistema de riego (Mega), traducidos por la ESP32 a un único carácter por Serial1 */
export type ComandoRiego = "ENCENDER" | "APAGAR" | "MODO_MANUAL" | "MODO_AUTOMATICO";

/** Comandos de configuración de la propia ESP32 (gateway), nunca llegan al Mega */
export type ComandoGateway = "RESET" | "AP" | "STATUS";

/** Alineado con com.uta.iot_backend.sensor.dto.DeviceStatusResponse */
export interface DeviceStatusResponse {
  wifi: { connected: boolean; ip: string; ssid: string };
  mqtt: { connected: boolean; host: string; port: number; topic: string };
  device: { id: string; ap_mode: boolean; uptime_ms: number };
}

/** Alineado con com.uta.iot_backend.sensor.dto.IrrigationStateResponse */
export interface IrrigationStateResponse {
  encendido: boolean;
  modoAutomatico: boolean;
  ultimoComando: string;
  timestamp: string;
}
