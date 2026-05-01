import type { LucideIcon } from "lucide-react";
import { Droplets, Eye, Gauge, Wind } from "lucide-react";
import type { CurrentWeather } from "@/modules/dashboard/types";
import { OPEN_METEO_LOCATION_LABEL, OPEN_METEO_UNAVAILABLE } from "@/modules/dashboard/data/openMeteoClimate";
import { WeatherCurrentHeroIcon } from "@/modules/dashboard/components/weather/WeatherFilledIcons";
import { Card } from "@/shared/components/ui/Card";
import { IconBox } from "@/shared/components/ui/IconBox";

export function WeatherPanel({ weather }: { weather: CurrentWeather }) {
  const unavailable = weather.condition === OPEN_METEO_UNAVAILABLE;
  const location = unavailable ? "—" : (weather.location ?? OPEN_METEO_LOCATION_LABEL);
  const pressure =
    weather.pressureHpa != null && !Number.isNaN(weather.pressureHpa) ? `${Math.round(weather.pressureHpa)} hPa` : "—";
  const visibility =
    weather.visibilityKm != null && !Number.isNaN(weather.visibilityKm) ? `${weather.visibilityKm} km` : "—";
  const hero = weather.hero ?? "cloudy";

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden" padding="sm">
      <h2 className="mb-2 shrink-0 text-sm font-semibold uppercase tracking-wide text-white">Clima actual</h2>
      <div className="flex min-h-0 flex-1 items-center gap-3">
        <WeatherCurrentHeroIcon hero={hero} />
        <div className="min-w-0">
          <p className="text-2xl font-semibold leading-none text-white">
            {unavailable ? "—" : `${weather.temperature.toFixed(1)} °C`}
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-white">{weather.condition}</p>
          <p className="truncate text-xs font-medium text-slate-300">{location}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-1 border-t border-slate-700/40 pt-2">
        <FooterStat
          icon={Droplets}
          label="Humedad"
          value={unavailable ? "—" : `${weather.relativeHumidity}%`}
        />
        <FooterStat icon={Gauge} label="Presión" value={pressure} />
        <FooterStat icon={Wind} label="Viento" value={unavailable ? "—" : `${weather.windSpeed} km/h`} />
        <FooterStat icon={Eye} label="Visibilidad" value={visibility} />
      </div>
    </Card>
  );
}

function FooterStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <IconBox icon={Icon} className="size-7" iconSizeClassName="size-3" rounded="full" />
      <span className="text-[9px] font-semibold uppercase tracking-wide text-white">{label}</span>
      <span className="truncate px-0.5 text-[10px] font-semibold text-white">{value}</span>
    </div>
  );
}
