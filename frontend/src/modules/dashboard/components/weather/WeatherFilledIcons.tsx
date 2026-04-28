import type { CurrentWeather, ForecastDay } from "@/modules/dashboard/types";

const forecastWarm =
  "h-16 w-16 shrink-0 drop-shadow-[0_0_10px_rgba(251,191,36,0.35)]";
const forecastCool =
  "h-16 w-16 shrink-0 drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]";
const forecastWet =
  "h-16 w-16 shrink-0 drop-shadow-[0_0_10px_rgba(56,189,248,0.4)]";
const forecastStorm =
  "h-16 w-16 shrink-0 drop-shadow-[0_0_12px_rgba(196,181,253,0.45)]";

const currentWarm =
  "h-24 w-24 shrink-0 drop-shadow-[0_0_14px_rgba(251,191,36,0.45)]";
const currentCool =
  "h-24 w-24 shrink-0 drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]";
const currentWet =
  "h-24 w-24 shrink-0 drop-shadow-[0_0_14px_rgba(56,189,248,0.45)]";
const currentStorm =
  "h-24 w-24 shrink-0 drop-shadow-[0_0_16px_rgba(196,181,253,0.5)]";

export function SunnyIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="15" fill="#FBBF24" />
      <g stroke="#FBBF24" strokeWidth="5" strokeLinecap="round">
        <line x1="32" y1="4" x2="32" y2="12" />
        <line x1="32" y1="52" x2="32" y2="60" />
        <line x1="4" y1="32" x2="12" y2="32" />
        <line x1="52" y1="32" x2="60" y2="32" />
        <line x1="12" y1="12" x2="18" y2="18" />
        <line x1="46" y1="46" x2="52" y2="52" />
        <line x1="52" y1="12" x2="46" y2="18" />
        <line x1="18" y1="46" x2="12" y2="52" />
      </g>
    </svg>
  );
}

export function CloudIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="64" height="64" viewBox="0 0 64 64" fill="none">
      <path
        d="M18 46H45C52 46 56 42 56 36C56 30 51 26 45 27C42 20 35 17 29 20C24 22 21 26 20 31C13 31 8 34 8 40C8 44 12 46 18 46Z"
        fill="#E5E7EB"
      />
    </svg>
  );
}

export function PartlyCloudyIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle cx="40" cy="22" r="12" fill="#FBBF24" />
      <g stroke="#FBBF24" strokeWidth="4" strokeLinecap="round">
        <line x1="40" y1="4" x2="40" y2="10" />
        <line x1="40" y1="34" x2="40" y2="40" />
        <line x1="22" y1="22" x2="28" y2="22" />
        <line x1="52" y1="22" x2="58" y2="22" />
        <line x1="27" y1="9" x2="31" y2="13" />
        <line x1="53" y1="9" x2="49" y2="13" />
      </g>
      <path
        d="M18 46H45C52 46 56 42 56 36C56 30 51 26 45 27C42 20 35 17 29 20C24 22 21 26 20 31C13 31 8 34 8 40C8 44 12 46 18 46Z"
        fill="#E5E7EB"
      />
    </svg>
  );
}

export function RainIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="64" height="64" viewBox="0 0 64 64" fill="none">
      <path
        d="M18 38H45C52 38 56 34 56 28C56 22 51 18 45 19C42 12 35 9 29 12C24 14 21 18 20 23C13 23 8 26 8 32C8 36 12 38 18 38Z"
        fill="#E5E7EB"
      />
      <g stroke="#38BDF8" strokeWidth="4" strokeLinecap="round">
        <line x1="24" y1="44" x2="20" y2="54" />
        <line x1="34" y1="44" x2="30" y2="56" />
        <line x1="44" y1="44" x2="40" y2="54" />
      </g>
    </svg>
  );
}

/** Tormenta: nube rellena + relámpago relleno (no descrito en el brief; coherente con el set). */
export function StormIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="64" height="64" viewBox="0 0 64 64" fill="none">
      <path
        d="M16 40H42C49 40 53 36 53 30C53 24 48 20 42 21C39 14 32 11 26 14C21 16 18 20 17 25C10 25 5 28 5 34C5 38 9 40 16 40Z"
        fill="#D1D5DB"
      />
      <path d="M36 22 L32 36 L38 36 L30 52 L44 32 L36 32 Z" fill="#FBBF24" />
    </svg>
  );
}

type Hero = NonNullable<CurrentWeather["hero"]>;

export function WeatherForecastIcon({ condition }: { condition: ForecastDay["condition"] }) {
  switch (condition) {
    case "sunny":
      return <SunnyIcon className={forecastWarm} />;
    case "partly":
      return <PartlyCloudyIcon className={forecastWarm} />;
    case "cloudy":
      return <CloudIcon className={forecastCool} />;
    case "rain":
      return <RainIcon className={forecastWet} />;
    case "storm":
      return <StormIcon className={forecastStorm} />;
    default:
      return <CloudIcon className={forecastCool} />;
  }
}

export function WeatherCurrentHeroIcon({ hero }: { hero: Hero }) {
  switch (hero) {
    case "sunny":
      return <SunnyIcon className={currentWarm} />;
    case "partly":
      return <PartlyCloudyIcon className={currentWarm} />;
    case "cloudy":
      return <CloudIcon className={currentCool} />;
    case "rain":
      return <RainIcon className={currentWet} />;
    case "storm":
      return <StormIcon className={currentStorm} />;
    default:
      return <CloudIcon className={currentCool} />;
  }
}
