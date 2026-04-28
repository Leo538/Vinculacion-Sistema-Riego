export type SensorIconKey = "droplets" | "thermometer" | "waves" | "activity" | "wifi";

/** Iconos de la lista detallada (sin wifi: solo tarjetas resumen) */
export type SensorListIconKey = "droplets" | "thermometer" | "waves" | "activity";

export interface SensorSummaryItem {
  id: string;
  label: string;
  value: string;
  iconKey: SensorIconKey;
  caption: string;
  captionClassName?: string;
}

export interface SensorDetailRow {
  id: string;
  name: string;
  value: string;
  online: boolean;
  statusLabel: string;
  lastReading: string;
  zone: string;
  iconKey: SensorListIconKey;
}

export interface SensorSeriesPoint {
  hour: string;
  value: number;
}

export interface SensorTechnicalStats {
  activeSensors: number;
  disconnectedSensors: number;
  readingsToday: number;
  updateFrequency: string;
}
