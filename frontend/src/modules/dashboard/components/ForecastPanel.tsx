import type { ForecastDay } from "@/modules/dashboard/types";
import { WeatherForecastIcon } from "@/modules/dashboard/components/weather/WeatherFilledIcons";
import { Card } from "@/shared/components/ui/Card";

export function ForecastPanel({ forecast }: { forecast: ForecastDay[] }) {
  if (forecast.length === 0) {
    return (
      <Card className="flex h-full min-h-0 flex-col overflow-hidden" padding="sm">
        <h2 className="mb-2 shrink-0 text-sm font-semibold uppercase tracking-wide text-white">Pronóstico (7 días)</h2>
        <p className="flex flex-1 items-center justify-center px-2 text-center text-[10px] text-slate-500">
          Sin pronóstico (Open-Meteo no disponible o sin datos).
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden" padding="sm">
      <h2 className="mb-2 shrink-0 text-sm font-semibold uppercase tracking-wide text-white">
        Pronóstico (7 días)
      </h2>
      <div className="min-h-0 flex-1 overflow-x-auto">
        <div className="grid h-full min-h-[8.5rem] w-full min-w-[min(100%,640px)] grid-cols-7 sm:min-w-0">
          {forecast.map((day, index) => (
            <div
              key={`${day.day}-${index}`}
              className={`flex h-full min-h-0 flex-col items-center justify-center gap-0.5 px-1 py-1 ${
                index < forecast.length - 1 ? "border-r border-slate-700/40" : ""
              }`}
            >
              <p className="text-sm font-semibold leading-tight text-white">{day.day}</p>
              <div className="flex flex-1 flex-col items-center justify-center">
                <WeatherForecastIcon condition={day.condition} />
              </div>
              <p className="text-sm font-semibold leading-tight text-white">{day.maxTemp}°</p>
              <p className="text-sm font-semibold leading-tight text-white">{day.minTemp}°</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
