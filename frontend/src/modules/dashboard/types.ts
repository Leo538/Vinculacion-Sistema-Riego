export type SensorStatus = "online" | "offline";

export interface SummaryMetric {
  id: string;
  label: string;
  value: string;
  status: string;
  trend?: "up" | "down" | "stable";
  icon: "droplets" | "thermometer" | "cloud-rain" | "waves" | "power" | "gauge" | "activity";
}

export interface CurrentWeather {
  temperature: number;
  condition: string;
  rainProbability: number;
  windSpeed: number;
  relativeHumidity: number;
  /** Icono principal del panel (sol, nube, lluvia, tormenta) */
  hero?: "sunny" | "partly" | "cloudy" | "rain" | "storm";
  /** Presión atmosférica (hPa), mock o API */
  pressureHpa?: number;
  /** Visibilidad estimada (km) */
  visibilityKm?: number;
  /** Ubicación mostrada en el panel */
  location?: string;
  /** Código WMO actual (Open-Meteo) para icono Wi fino */
  weatherCode?: number;
}

export interface ForecastDay {
  day: string;
  minTemp: number;
  maxTemp: number;
  condition: "sunny" | "partly" | "cloudy" | "rain" | "storm";
  rainProbability: number;
}

export interface SensorReading {
  id: string;
  name: string;
  value: string;
  status: SensorStatus;
  updatedAt: string;
}

export interface IrrigationDecision {
  action: "Regar ahora" | "No regar";
  suggestedTime: string;
  reason: string;
}

export interface AlertItem {
  id: string;
  title: string;
  severity: "alta" | "media" | "baja";
  detail: string;
}

export interface SoilHumidityPoint {
  hour: string;
  value: number;
}

export interface DashboardData {
  summaryMetrics: SummaryMetric[];
  weather: CurrentWeather;
  forecast: ForecastDay[];
  sensors: SensorReading[];
  irrigation: IrrigationDecision;
  alerts: AlertItem[];
  soilHumiditySeries: SoilHumidityPoint[];
}
