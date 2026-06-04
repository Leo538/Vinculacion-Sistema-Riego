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
