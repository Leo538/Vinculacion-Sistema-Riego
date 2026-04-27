import type { AlertItem, SensorStatus } from "@/types/dashboard.types";

export const formatStatusLabel = (status: SensorStatus): string =>
  status === "online" ? "En línea" : "Fuera de línea";

export const formatSeverityColor = (severity: AlertItem["severity"]): string => {
  if (severity === "alta") {
    return "text-danger";
  }
  if (severity === "media") {
    return "text-warning";
  }
  return "text-info";
};

export const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
};
