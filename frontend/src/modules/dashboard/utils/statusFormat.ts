import type { AlertItem, SensorStatus } from "@/modules/dashboard/types";

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
