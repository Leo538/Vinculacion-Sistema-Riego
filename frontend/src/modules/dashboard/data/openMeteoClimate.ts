import type { CurrentWeather, ForecastDay } from "@/modules/dashboard/types";

export const OPEN_METEO_LOCATION_LABEL = "Tisaleo, Ecuador";

export const OPEN_METEO_LATITUDE = "-1.35";
export const OPEN_METEO_LONGITUDE = "-78.67";

const OPEN_METEO_URL =
  "https://api.open-meteo.com/v1/forecast" +
  `?latitude=${OPEN_METEO_LATITUDE}&longitude=${OPEN_METEO_LONGITUDE}` +
  "&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,surface_pressure,visibility" +
  "&hourly=precipitation_probability,relative_humidity_2m" +
  "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
  "&wind_speed_unit=kmh&timezone=auto";

const OPEN_METEO_ELEVATION_URL =
  `https://api.open-meteo.com/v1/elevation?latitude=${OPEN_METEO_LATITUDE}&longitude=${OPEN_METEO_LONGITUDE}`;

const dayNames = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

/** Condición reservada para fallos de API: el panel no muestra números inventados. */
export const OPEN_METEO_UNAVAILABLE = "Sin datos de Open-Meteo";

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

export type OpenMeteoClimateBundle = {
  weather: CurrentWeather;
  forecast: ForecastDay[];
  rainProbabilityNow: number;
  apparentTemperature: number;
  /** Elevación sobre el nivel del mar (modelo digital), Open-Meteo Elevation API, en metros */
  elevationMeters?: number;
};

function fallbackClimate(): OpenMeteoClimateBundle {
  return {
    weather: {
      temperature: 0,
      condition: OPEN_METEO_UNAVAILABLE,
      rainProbability: 0,
      windSpeed: 0,
      relativeHumidity: 0,
      hero: "cloudy",
      location: "—"
    },
    forecast: [],
    rainProbabilityNow: 0,
    apparentTemperature: 0,
    elevationMeters: undefined
  };
}

async function parseElevationMeters(elevationRes: Response): Promise<number | undefined> {
  try {
    if (!elevationRes.ok) return undefined;
    const j = await elevationRes.json();
    const arr = j.elevation as number[] | undefined;
    if (!arr?.length) return undefined;
    const m = Number(arr[0]);
    if (!Number.isFinite(m)) return undefined;
    return Math.round(m);
  } catch {
    return undefined;
  }
}

/**
 * Solo datos meteorológicos externos (Open-Meteo). Sin mezclar sensores IoT.
 */
export async function getOpenMeteoClimateOnly(): Promise<OpenMeteoClimateBundle> {
  try {
    const [response, elevationRes] = await Promise.all([
      fetch(OPEN_METEO_URL, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store"
      }),
      fetch(OPEN_METEO_ELEVATION_URL, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store"
      })
    ]);

    const elevationMeters = await parseElevationMeters(elevationRes);

    if (!response.ok) {
      const fb = fallbackClimate();
      return { ...fb, elevationMeters };
    }

    const apiData = await response.json();
    const current = apiData.current;
    const daily = apiData.daily;
    const hourly = apiData.hourly;

    const times = (hourly?.time as string[] | undefined) ?? [];
    const rainByHour = (hourly?.precipitation_probability as number[] | undefined) ?? [];
    const currentIdx = times.length ? findCurrentHourlyIndex(times) : 0;
    const rainProbabilityNow = Math.round(rainByHour[currentIdx] ?? rainByHour[0] ?? 0);
    const wCode = current.weather_code ?? 0;
    const conditionLabel = mapWeatherCodeToLabel(wCode);
    const pressureRaw = current.surface_pressure;
    const pressureHpa =
      pressureRaw !== undefined && pressureRaw !== null ? Math.round(Number(pressureRaw)) : undefined;
    const temp = Number(current.temperature_2m);
    const apparent = Number(current.apparent_temperature ?? current.temperature_2m);
    const rh = Math.round(current.relative_humidity_2m);
    const windKmh = Math.round(current.wind_speed_10m);
    const visM = current.visibility;
    const visibilityKm =
      visM !== undefined && visM !== null && !Number.isNaN(Number(visM))
        ? Math.round((Number(visM) / 1000) * 10) / 10
        : undefined;

    const forecast: ForecastDay[] = (daily.time as string[]).slice(0, 7).map((day: string, index: number) => {
      const date = new Date(day);
      return {
        day: dayNames[date.getDay()],
        minTemp: Math.round(daily.temperature_2m_min[index]),
        maxTemp: Math.round(daily.temperature_2m_max[index]),
        condition: mapWeatherCodeToCondition(daily.weather_code[index]),
        rainProbability: Math.round(daily.precipitation_probability_max[index] ?? 0)
      };
    });

    const weather: CurrentWeather = {
      temperature: temp,
      condition: conditionLabel,
      hero: mapWeatherCodeToHero(wCode),
      weatherCode: wCode,
      rainProbability: rainProbabilityNow,
      windSpeed: windKmh,
      relativeHumidity: rh,
      pressureHpa,
      visibilityKm,
      location: OPEN_METEO_LOCATION_LABEL
    };

    return {
      weather,
      forecast,
      rainProbabilityNow,
      apparentTemperature: apparent,
      elevationMeters
    };
  } catch {
    return fallbackClimate();
  }
}
