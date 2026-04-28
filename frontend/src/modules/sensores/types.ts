export type SensorIconKey =
  | "droplets"
  | "thermometer"
  | "waves"
  | "activity"
  | "cloud-rain"
  | "sun"
  | "gauge";

export type SensorLevel = "low" | "normal" | "high" | "critical";

export interface SensorGaugeItem {
  id: string;
  label: string;
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
  iconKey: SensorIconKey;
  value: number;
  displayValue: string;
  min: number;
  max: number;
  level: SensorLevel;
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
  readingsToday: number;
  updateFrequency: string;
}

export interface SensorCompactStatusItem {
  id: string;
  name: string;
  iconKey: SensorIconKey;
  value: string;
  online: boolean;
}
