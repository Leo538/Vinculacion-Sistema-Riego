import type { DashboardData } from "@/types/dashboard.types";

export const mockDashboardData: DashboardData = {
  summaryMetrics: [
    { id: "soil", label: "Humedad suelo", value: "38%", status: "Baja", trend: "down", icon: "droplets" },
    { id: "temp", label: "Temperatura", value: "24.6 °C", status: "Sensación 25.1 °C", trend: "stable", icon: "thermometer" },
    { id: "rain", label: "Prob. lluvia", value: "35%", status: "Media", trend: "stable", icon: "cloud-rain" },
    { id: "water", label: "Nivel tanque", value: "41%", status: "Moderado", trend: "down", icon: "waves" },
    { id: "pump", label: "Estado bomba", value: "Activa", status: "En línea", trend: "stable", icon: "activity" }
  ],
  weather: {
    temperature: 24.6,
    condition: "Despejado",
    hero: "sunny",
    weatherCode: 0,
    rainProbability: 35,
    windSpeed: 12,
    relativeHumidity: 62,
    pressureHpa: 1012,
    visibilityKm: 10,
    location: "Madrid, España"
  },
  forecast: [
    { day: "Mie", minTemp: 17, maxTemp: 25, condition: "partly", rainProbability: 40 },
    { day: "Jue", minTemp: 16, maxTemp: 24, condition: "rain", rainProbability: 70 },
    { day: "Vie", minTemp: 15, maxTemp: 23, condition: "cloudy", rainProbability: 30 },
    { day: "Sab", minTemp: 18, maxTemp: 27, condition: "sunny", rainProbability: 10 },
    { day: "Dom", minTemp: 17, maxTemp: 26, condition: "storm", rainProbability: 80 },
    { day: "Lun", minTemp: 16, maxTemp: 24, condition: "rain", rainProbability: 60 },
    { day: "Mar", minTemp: 18, maxTemp: 28, condition: "sunny", rainProbability: 15 }
  ],
  sensors: [
    { id: "s1", name: "Humedad suelo", value: "38%", status: "online", updatedAt: "Hace 1 min" },
    { id: "s2", name: "Temperatura", value: "24.6 °C", status: "online", updatedAt: "Hace 1 min" },
    { id: "s3", name: "Humedad aire", value: "62%", status: "online", updatedAt: "Hace 1 min" },
    { id: "s4", name: "Presión", value: "1012 hPa", status: "online", updatedAt: "Hace 2 min" },
    { id: "s5", name: "Viento", value: "12 km/h", status: "online", updatedAt: "Hace 2 min" },
    { id: "s6", name: "Lluvia", value: "Sin lluvia", status: "online", updatedAt: "Hace 2 min" },
    { id: "s7", name: "Nivel tanque", value: "41%", status: "online", updatedAt: "Hace 2 min" }
  ],
  irrigation: {
    action: "Regar ahora",
    suggestedTime: "15-20 minutos",
    reason: "Humedad del suelo por debajo de 40%, sin lluvia inmediata y tanque en nivel seguro."
  },
  alerts: [
    { id: "a1", title: "Humedad baja", severity: "alta", detail: "El suelo esta por debajo del umbral recomendado (40%)." },
    { id: "a2", title: "Nivel de agua bajo", severity: "media", detail: "Tanque al 41%. Considerar recarga preventiva." },
    { id: "a3", title: "Posible lluvia", severity: "baja", detail: "Se espera lluvia moderada para el domingo." },
    { id: "a4", title: "Sensor desconectado", severity: "media", detail: "Sensor de caudal reporto desconexion temporal anoche." }
  ],
  soilHumiditySeries: [
    { hour: "00:00", value: 54 },
    { hour: "04:00", value: 52 },
    { hour: "08:00", value: 48 },
    { hour: "12:00", value: 44 },
    { hour: "16:00", value: 40 },
    { hour: "20:00", value: 38 }
  ]
};
