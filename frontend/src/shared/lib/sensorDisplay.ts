/**
 * Etiquetas amigables para lecturas IoT (Dashboard, Sensores, etc.).
 * No modifica datos del backend.
 */

/** Título corto derivado del `type` de la lectura IoT. */
export function formatSensorTypeTitle(type: string): string {
  const raw = type.trim().toLowerCase();
  const haystack = `${type}`.toLowerCase();

  const exact = (s: string) => raw === s;
  if (exact("soil_moisture") || raw.startsWith("soil_moist")) return "Humedad de suelo";
  if (exact("humidity")) return "Humedad ambiental";
  if (haystack.includes("relative_humidity") && !haystack.includes("soil") && !haystack.includes("suelo")) {
    return "Humedad ambiental";
  }
  if (exact("temperature") || raw === "temp") return "Temperatura";
  if (exact("water_level")) return "Nivel del tanque";
  if (exact("flow")) return "Flujo de agua";

  if (haystack.includes("soil_moisture") || (haystack.includes("soil") && haystack.includes("moist")))
    return "Humedad de suelo";
  if ((haystack.includes("humidity") || haystack.includes("humedad")) && !haystack.includes("soil") && !haystack.includes("suelo"))
    return "Humedad ambiental";
  if (haystack.includes("temperature") || haystack.includes("temperatura") || /\btemp\b/.test(haystack)) return "Temperatura";
  if (haystack.includes("water_level") || haystack.includes("tanque")) return "Nivel del tanque";
  if (haystack.includes("flow") || haystack.includes("caudal")) return "Flujo de agua";

  return formatUnknownTypePhrase(type);
}

function formatUnknownTypePhrase(type: string): string {
  const words = type
    .trim()
    .replace(/_/g, " ")
    .split(/\s+/);
  return words.map((w) => w.slice(0, 1).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

function readingAgePhrase(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "Sin marca de tiempo";
  const diff = Date.now() - t;
  const sec = Math.floor(diff / 1000);
  if (sec < 120) return "Lectura instantánea";
  if (sec < 3600) return `Hace ${Math.floor(sec / 60)} min`;
  const h = Math.floor(sec / 3600);
  if (h < 24) return `Hace ${h} h`;
  return new Date(t).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/** Segunda línea: `sensorId · lectura instantánea` o tiempo relativo. */
export function getSensorSubtitle(sensorId: string, timestampIso: string): string {
  return `${sensorId} · ${readingAgePhrase(timestampIso)}`;
}

/** Alias útiles para llamadas desde UI. */
export const formatSensorType = formatSensorTypeTitle;

export function getSensorDisplayLabels(type: string, sensorId: string, timestampIso: string): { title: string; subtitle: string } {
  return { title: formatSensorTypeTitle(type), subtitle: getSensorSubtitle(sensorId, timestampIso) };
}

/** Encabezado de gráfica histórica 24 h (p. ej. /sensores): reusa `formatSensorTypeTitle`. */
export function formatSensorHistoryChartTitle(type: string): string {
  const t = `${type ?? ""}`.trim();
  const base = t ? formatSensorTypeTitle(t) : "Sensor";
  return `${base} (24 h)`;
}

export function formatSensorHistoryChartSubtitle(sensorId: string): string {
  return `${sensorId} · Backend IoT · últimas 24 h`;
}
