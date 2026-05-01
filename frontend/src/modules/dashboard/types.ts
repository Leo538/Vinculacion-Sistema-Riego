export type SensorStatus = "online" | "offline";

export interface SummaryMetric {
  id: string;
  label: string;
  /** Solo IoT: `sensorId · tiempo` o referencia contextual. Opcional para tarjetas Open-Meteo. */
  subtitle?: string;
  value: string;
  status: string;
  trend?: "up" | "down" | "stable";
  icon: "droplets" | "thermometer" | "cloud-rain" | "waves" | "power" | "gauge" | "activity" | "mountain";
}

export interface CurrentWeather {
  temperature: number;
  condition: string;
  rainProbability: number;
  windSpeed: number;
  relativeHumidity: number;
  /** Icono principal del panel (sol, nube, lluvia, tormenta) */
  hero?: "sunny" | "partly" | "cloudy" | "rain" | "storm";
  /** Presión superficial (hPa) desde Open-Meteo cuando existe */
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
  /** ISO YYYY-MM-DD (Open-Meteo daily) cuando está disponible. */
  isoDate?: string;
  minTemp: number;
  maxTemp: number;
  condition: "sunny" | "partly" | "cloudy" | "rain" | "storm";
  rainProbability: number;
}

export interface SensorReading {
  id: string;
  /** Título legible del tipo de medición. */
  title: string;
  /** `sensorId · lectura instantánea` / tiempo relativo */
  subtitle: string;
  value: string;
  status: SensorStatus;
}

export type IrrigationAction =
  | "Regar ahora"
  | "No regar"
  | "Esperar lluvia"
  | "Sin dato de suelo";

export interface IrrigationDecision {
  action: IrrigationAction;
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
