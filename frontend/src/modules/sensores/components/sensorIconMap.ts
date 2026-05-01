import { Activity, CloudRain, Droplets, Gauge, Mountain, Sun, Thermometer, Waves } from "lucide-react";

export const sensorIconMap = {
  droplets: Droplets,
  thermometer: Thermometer,
  waves: Waves,
  activity: Activity,
  "cloud-rain": CloudRain,
  sun: Sun,
  gauge: Gauge,
  mountain: Mountain
} as const;
