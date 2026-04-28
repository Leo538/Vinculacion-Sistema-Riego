import type { LucideIcon } from "lucide-react";
import { Droplets, Eye, Gauge, Wind } from "lucide-react";
import type { CurrentWeather } from "@/modules/dashboard/types";
import { WeatherCurrentHeroIcon } from "@/modules/dashboard/components/weather/WeatherFilledIcons";
import { Card } from "@/shared/components/ui/Card";
import { IconBox } from "@/shared/components/ui/IconBox";

export function WeatherPanel({ weather }: { weather: CurrentWeather }) {
  const location = weather.location ?? "Madrid, España";
  const pressure = weather.pressureHpa ?? 1012;
  const visibility = weather.visibilityKm ?? 10;
  const hero = weather.hero ?? "cloudy";

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden" padding="sm">
      <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Clima actual</h2>
      <div className="flex min-h-0 flex-1 items-center gap-3">
        <WeatherCurrentHeroIcon hero={hero} />
        <div className="min-w-0">
          <p className="text-2xl font-semibold leading-none text-white">{weather.temperature.toFixed(1)} °C</p>
          <p className="mt-1 truncate text-xs text-slate-300">{weather.condition}</p>
          <p className="truncate text-[10px] text-slate-500">{location}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-1 border-t border-slate-700/40 pt-2">
        <FooterStat icon={Droplets} label="Humedad" value={`${weather.relativeHumidity}%`} />
        <FooterStat icon={Gauge} label="Presión" value={`${pressure} hPa`} />
        <FooterStat icon={Wind} label="Viento" value={`${weather.windSpeed} km/h`} />
        <FooterStat icon={Eye} label="Visibilidad" value={`${visibility} km`} />
      </div>
    </Card>
  );
}

function FooterStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <IconBox icon={Icon} className="size-7" iconSizeClassName="size-3" rounded="full" />
      <span className="text-[8px] font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <span className="truncate px-0.5 text-[9px] font-medium text-slate-200">{value}</span>
    </div>
  );
}
