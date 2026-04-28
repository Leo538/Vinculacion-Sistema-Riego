import type {
  SensorBarIndicatorItem,
  SensorCompactStatusItem,
  SensorGaugeItem,
  SensorHistorySeries,
  SensorSeriesPoint,
  SensorTechnicalStats
} from "@/modules/sensores/types";

function build24hSeries(base: number, amplitude: number, seed: number): SensorSeriesPoint[] {
  const out: SensorSeriesPoint[] = [];
  for (let i = 0; i < 24; i++) {
    const t = (i / 24) * Math.PI * 2;
    const wobble = Math.sin(t * 1.25 + seed) * 0.42 + Math.cos(t * 0.78 + seed * 0.25) * 0.22;
    const value = Math.round((base + amplitude * wobble) * 10) / 10;
    out.push({
      hour: `${String(i).padStart(2, "0")}:00`,
      value: Math.max(0, value)
    });
  }
  return out;
}

const primaryGauges: SensorGaugeItem[] = [
  {
    id: "soil",
    label: "Humedad del suelo",
    iconKey: "droplets",
    value: 22,
    displayValue: "22%",
    unit: "%",
    min: 0,
    max: 100,
    warningMin: 25,
    warningMax: 65,
    criticalMin: 15,
    criticalMax: 80
  },
  {
    id: "temp",
    label: "Temperatura ambiente",
    iconKey: "thermometer",
    value: 16.8,
    displayValue: "16.8 °C",
    unit: "°C",
    min: 0,
    max: 45,
    warningMin: 8,
    warningMax: 33,
    criticalMin: 3,
    criticalMax: 39
  },
  {
    id: "tank",
    label: "Nivel del tanque",
    iconKey: "waves",
    value: 41,
    displayValue: "41%",
    unit: "%",
    min: 0,
    max: 100,
    warningMin: 25,
    warningMax: 80,
    criticalMin: 15,
    criticalMax: 90
  },
  {
    id: "flow",
    label: "Flujo de agua",
    iconKey: "activity",
    value: 7,
    displayValue: "7 L/min",
    unit: "L/min",
    min: 0,
    max: 15,
    warningMin: 2,
    warningMax: 11,
    criticalMin: 1,
    criticalMax: 13
  }
];

const barIndicators: SensorBarIndicatorItem[] = [
  {
    id: "humidity-air",
    label: "Humedad ambiental",
    iconKey: "droplets",
    value: 62,
    displayValue: "62%",
    min: 0,
    max: 100,
    level: "normal"
  },
  {
    id: "rain-prob",
    label: "Probabilidad de lluvia",
    iconKey: "cloud-rain",
    value: 35,
    displayValue: "35%",
    min: 0,
    max: 100,
    level: "low"
  },
  {
    id: "solar-intensity",
    label: "Intensidad solar",
    iconKey: "sun",
    value: 74,
    displayValue: "74%",
    min: 0,
    max: 100,
    level: "high"
  },
  {
    id: "atm-pressure",
    label: "Presión atmosférica",
    iconKey: "gauge",
    value: 1012,
    displayValue: "1012 hPa",
    min: 960,
    max: 1040,
    level: "normal"
  }
];

const historySeries: SensorHistorySeries[] = [
  {
    id: "soil-24h",
    title: "Humedad del suelo 24h",
    subtitle: "Últimas 24 horas · Cultivo A",
    valueLabel: "Humedad",
    unit: "%",
    color: "#38bdf8",
    data: build24hSeries(22, 4, 1)
  },
  {
    id: "temp-24h",
    title: "Temperatura 24h",
    subtitle: "Últimas 24 horas · ambiente",
    valueLabel: "Temperatura",
    unit: "°C",
    color: "#22C55E",
    data: build24hSeries(16.8, 1.4, 2)
  },
  {
    id: "tank-24h",
    title: "Nivel del tanque 24h",
    subtitle: "Últimas 24 horas · tanque principal",
    valueLabel: "Nivel",
    unit: "%",
    color: "#a78bfa",
    data: build24hSeries(41, 6, 3)
  }
];

const technical: SensorTechnicalStats = {
  activeSensors: 4,
  disconnectedSensors: 0,
  readingsToday: 284,
  updateFrequency: "cada 2 minutos"
};

const compactStatus: SensorCompactStatusItem[] = [
  { id: "s1", name: "Humedad suelo", iconKey: "droplets", value: "22%", online: true },
  { id: "s2", name: "Temperatura", iconKey: "thermometer", value: "16.8 °C", online: true },
  { id: "s3", name: "Nivel tanque", iconKey: "waves", value: "41%", online: true },
  { id: "s4", name: "Flujo agua", iconKey: "activity", value: "7 L/min", online: true }
];

export const sensorsData = {
  primaryGauges,
  barIndicators,
  historySeries,
  technical,
  compactStatus
};
