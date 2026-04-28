import type {
  SensorDetailRow,
  SensorSeriesPoint,
  SensorSummaryItem,
  SensorTechnicalStats
} from "@/types/sensors.types";

function build24hSeries(
  base: number,
  amplitude: number,
  seed: number
): SensorSeriesPoint[] {
  const out: SensorSeriesPoint[] = [];
  for (let i = 0; i < 24; i++) {
    const t = (i / 24) * Math.PI * 2;
    const wobble = Math.sin(t * 1.3 + seed) * 0.4 + Math.cos(t * 0.7 + seed * 0.2) * 0.25;
    const value = Math.round((base + amplitude * wobble) * 10) / 10;
    out.push({
      hour: `${String(i).padStart(2, "0")}:00`,
      value: Math.max(0, value)
    });
  }
  return out;
}

const summaryItems: SensorSummaryItem[] = [
  {
    id: "soil",
    label: "Humedad del suelo",
    value: "22%",
    iconKey: "droplets",
    caption: "Óptimo bajo",
    captionClassName: "text-amber-400"
  },
  {
    id: "temp",
    label: "Temperatura ambiente",
    value: "16.8 °C",
    iconKey: "thermometer",
    caption: "Estable",
    captionClassName: "text-sky-400"
  },
  {
    id: "tank",
    label: "Nivel del tanque",
    value: "41%",
    iconKey: "waves",
    caption: "Reserva media",
    captionClassName: "text-slate-400"
  },
  {
    id: "overall",
    label: "Estado general",
    value: "Operativo",
    iconKey: "wifi",
    caption: "Todos los nodos OK",
    captionClassName: "text-emerald-400"
  }
];

const sensorRows: SensorDetailRow[] = [
  {
    id: "soil-1",
    name: "Sensor de humedad del suelo",
    value: "22%",
    online: true,
    statusLabel: "En línea",
    lastReading: "Hace 2 min",
    zone: "Cultivo A",
    iconKey: "droplets"
  },
  {
    id: "temp-1",
    name: "Sensor de temperatura",
    value: "16.8 °C",
    online: true,
    statusLabel: "En línea",
    lastReading: "Hace 2 min",
    zone: "Cultivo A",
    iconKey: "thermometer"
  },
  {
    id: "tank-1",
    name: "Sensor de nivel de tanque",
    value: "41%",
    online: true,
    statusLabel: "En línea",
    lastReading: "Hace 3 min",
    zone: "Tanque principal",
    iconKey: "waves"
  },
  {
    id: "flow-1",
    name: "Sensor de flujo de agua",
    value: "7 L/min",
    online: true,
    statusLabel: "En línea",
    lastReading: "Hace 1 min",
    zone: "Línea principal",
    iconKey: "activity"
  }
];

const technical: SensorTechnicalStats = {
  activeSensors: 4,
  disconnectedSensors: 0,
  readingsToday: 284,
  updateFrequency: "cada 2 minutos"
};

export const mockSensorsData = {
  summaryItems,
  sensorRows,
  soilHumidity24h: build24hSeries(22, 4, 1),
  temperature24h: build24hSeries(16.8, 1.2, 2),
  tankLevel24h: build24hSeries(41, 6, 3),
  technical
};
