import type { CurrentWeather, DashboardData, ForecastDay, SensorReading } from "@/modules/dashboard/types";
import { mockDashboardData } from "@/modules/dashboard/data/mockDashboardData";

const OPEN_METEO_URL =
  "https://api.open-meteo.com/v1/forecast" +
  "?latitude=40.4168&longitude=-3.7038" +
  "&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,surface_pressure" +
  "&hourly=precipitation_probability,relative_humidity_2m" +
  "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
  "&wind_speed_unit=kmh&timezone=auto";

const dayNames = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

const mapWeatherCodeToCondition = (code: number): ForecastDay["condition"] => {
  if (code === 0 || code === 1) return "sunny";
  if (code === 2) return "partly";
  if ([3, 45, 48].includes(code)) return "cloudy";
  if ([95, 96, 99].includes(code)) return "storm";
  return "rain";
};

const mapWeatherCodeToHero = (code: number): NonNullable<CurrentWeather["hero"]> => {
  if (code === 0 || code === 1) return "sunny";
  if (code === 2) return "partly";
  if ([3, 45, 48].includes(code)) return "cloudy";
  if ([95, 96, 99].includes(code)) return "storm";
  return "rain";
};

const mapWeatherCodeToLabel = (code: number): string => {
  if (code === 0) return "Despejado";
  if (code === 1) return "Mayormente despejado";
  if (code === 2) return "Parcialmente nublado";
  if (code === 3) return "Nublado";
  if ([45, 48].includes(code)) return "Niebla";
  if ([95, 96, 99].includes(code)) return "Tormenta";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Lluvia";
  return "Variable";
};

const findCurrentHourlyIndex = (times: string[]): number => {
  const now = Date.now();
  let best = 0;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (let i = 0; i < times.length; i += 1) {
    const t = new Date(times[i] as string).getTime();
    const d = Math.abs(t - now);
    if (d < bestDiff) {
      bestDiff = d;
      best = i;
    }
  }
  return best;
};

const tankFromMock = (): SensorReading =>
  mockDashboardData.sensors.find((s) => s.id === "s7") ?? {
    id: "s7",
    name: "Nivel tanque",
    value: "41%",
    status: "online",
    updatedAt: "Hace 2 min"
  };

export async function getOpenMeteoDashboardData(): Promise<DashboardData> {
  try {
    const response = await fetch(OPEN_METEO_URL, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store"
    });

    if (!response.ok) {
      return mockDashboardData;
    }

    const apiData = await response.json();
    const current = apiData.current;
    const daily = apiData.daily;
    const hourly = apiData.hourly;

    const times = (hourly?.time as string[] | undefined) ?? [];
    const rainByHour = (hourly?.precipitation_probability as number[] | undefined) ?? [];
    const relHumByHour = (hourly?.relative_humidity_2m as number[] | undefined) ?? [];
    const currentIdx = times.length ? findCurrentHourlyIndex(times) : 0;
    const last24Count = Math.min(24, times.length);
    const from24 = Math.max(0, times.length - last24Count);
    const last24Times = times.slice(from24);
    const last24Hum = relHumByHour.slice(from24);

    const forecast: ForecastDay[] = (daily.time as string[]).slice(0, 7).map((day, index) => {
      const date = new Date(day);
      return {
        day: dayNames[date.getDay()],
        minTemp: Math.round(daily.temperature_2m_min[index]),
        maxTemp: Math.round(daily.temperature_2m_max[index]),
        condition: mapWeatherCodeToCondition(daily.weather_code[index]),
        rainProbability: Math.round(daily.precipitation_probability_max[index] ?? 0)
      };
    });

    const soilHumidityCurrent = Math.max(15, Math.round((current.relative_humidity_2m ?? 50) * 0.62));
    const rainProbabilityNow = Math.round(rainByHour[currentIdx] ?? rainByHour[0] ?? 0);
    const wCode = current.weather_code ?? 0;
    const conditionLabel = mapWeatherCodeToLabel(wCode);
    const pressureHpa = Math.round(current.surface_pressure ?? mockDashboardData.weather.pressureHpa ?? 1012);
    const temp = Number(current.temperature_2m);
    const apparent = Number(current.apparent_temperature ?? current.temperature_2m);
    const rh = Math.round(current.relative_humidity_2m);
    const windKmh = Math.round(current.wind_speed_10m);
    const rainLabel = rainProbabilityNow > 55 ? "Probable" : "Sin lluvia";

    const sensors: SensorReading[] = [
      {
        id: "s1",
        name: "Humedad suelo",
        value: `${soilHumidityCurrent}%`,
        status: "online",
        updatedAt: "En vivo"
      },
      {
        id: "s2",
        name: "Temperatura",
        value: `${temp.toFixed(1)} °C`,
        status: "online",
        updatedAt: "En vivo"
      },
      {
        id: "s3",
        name: "Humedad aire",
        value: `${rh}%`,
        status: "online",
        updatedAt: "En vivo"
      },
      {
        id: "s4",
        name: "Presión",
        value: `${pressureHpa} hPa`,
        status: "online",
        updatedAt: "En vivo"
      },
      {
        id: "s5",
        name: "Viento",
        value: `${windKmh} km/h`,
        status: "online",
        updatedAt: "En vivo"
      },
      {
        id: "s6",
        name: "Lluvia",
        value: rainLabel,
        status: "online",
        updatedAt: "En vivo"
      },
      tankFromMock()
    ];

    return {
      ...mockDashboardData,
      summaryMetrics: [
        {
          ...mockDashboardData.summaryMetrics[0],
          value: `${soilHumidityCurrent}%`,
          status: soilHumidityCurrent < 40 ? "Baja" : "Normal"
        },
        {
          ...mockDashboardData.summaryMetrics[1],
          value: `${temp.toFixed(1)} °C`,
          status: `Sensación ${apparent.toFixed(1)} °C`
        },
        {
          ...mockDashboardData.summaryMetrics[2],
          value: `${rainProbabilityNow}%`,
          status: rainProbabilityNow > 60 ? "Alta" : rainProbabilityNow > 30 ? "Media" : "Baja"
        },
        ...mockDashboardData.summaryMetrics.slice(3)
      ],
      weather: {
        ...mockDashboardData.weather,
        temperature: temp,
        condition: conditionLabel,
        hero: mapWeatherCodeToHero(wCode),
        weatherCode: wCode,
        rainProbability: rainProbabilityNow,
        windSpeed: windKmh,
        relativeHumidity: rh,
        pressureHpa,
        location: "Madrid, España"
      },
      forecast,
      sensors,
      irrigation: {
        action: soilHumidityCurrent < 42 && rainProbabilityNow < 60 ? "Regar ahora" : "No regar",
        suggestedTime: soilHumidityCurrent < 42 ? "15-20 minutos" : "Revisar en 2 horas",
        reason:
          soilHumidityCurrent < 42
            ? "Humedad del suelo baja y probabilidad de lluvia limitada según Open-Meteo."
            : "Humedad del suelo suficiente o lluvia probable según Open-Meteo."
      },
      soilHumiditySeries: last24Times.map((time: string, index: number) => ({
        hour: new Date(time).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false }),
        value: Math.max(18, Math.round((last24Hum[index] ?? 50) * 0.62))
      }))
    };
  } catch {
    return mockDashboardData;
  }
}
