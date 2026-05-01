export type SensorIconKey =
  | "droplets"
  | "thermometer"
  | "waves"
  | "activity"
  | "cloud-rain"
  | "sun"
  | "gauge"
  | "mountain";

export type SensorLevel = "low" | "normal" | "high" | "critical";

export interface SensorGaugeItem {
  id: string;
  label: string;
  subtitle?: string;
  iconKey: SensorIconKey;
  value: number;
  displayValue: string;
  unit: string;
  min: number;
  max: number;
  warningMin?: number;
  warningMax?: number;
  criticalMin?: number;
  criticalMax?: number;
}

export interface SensorBarIndicatorItem {
  id: string;
  label: string;
  /** Segunda línea (p. ej. sensorId · tiempo) para barras IoT. */
  subtitle?: string;
  iconKey: SensorIconKey;
  value: number;
  displayValue: string;
  min: number;
  max: number;
  level: SensorLevel;
  /**
   * Si es false: solo valor y estado textual, sin barra ni porcentaje secundario (p. ej. presión hPa externa).
   * Por defecto true.
   */
  showPercentBar?: boolean;
  /** Texto bajo el título; si no existe, se usa la etiqueta de nivel (Bajo/Normal/Alto). */
  caption?: string;
}

export interface SensorSeriesPoint {
  hour: string;
  value: number;
}

export interface SensorHistorySeries {
  id: string;
  title: string;
  subtitle: string;
  valueLabel: string;
  unit: string;
  color: string;
  data: SensorSeriesPoint[];
}

export interface SensorTechnicalStats {
  activeSensors: number;
  disconnectedSensors: number;
  /** Conteo desde el backend; null si no se pudo calcular. */
  readingsToday: number | null;
  updateFrequency: string;
}

export interface SensorCompactStatusItem {
  id: string;
  title: string;
  subtitle: string;
  iconKey: SensorIconKey;
  value: string;
  online: boolean;
}
