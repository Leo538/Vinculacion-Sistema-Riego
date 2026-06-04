"use client";

interface IotDeviceSelectorProps {
  deviceIds: string[];
  value: string;
  onChange: (deviceId: string) => void;
  connectionStatus?: "idle" | "connecting" | "connected" | "error";
  connectionError?: string | null;
}

/** Selector de dispositivo legible en modo claro y oscuro (Dashboard, Sensores, Riego). */
export function IotDeviceSelector({
  deviceIds,
  value,
  onChange,
  connectionStatus = "idle",
  connectionError
}: IotDeviceSelectorProps) {
  const selectClass =
    "max-w-[10rem] cursor-pointer rounded-lg border px-2 py-1.5 text-[10px] font-medium shadow-sm outline-none transition-colors " +
    "border-slate-300 bg-white text-slate-900 " +
    "hover:border-sky-400 hover:bg-slate-50 " +
    "focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 " +
    "disabled:cursor-not-allowed disabled:opacity-55 " +
    "dark:border-slate-600/80 dark:bg-[#0f1a2a] dark:text-slate-100 dark:shadow-inner dark:hover:border-slate-500 dark:hover:bg-[#0f1a2a] " +
    "dark:focus:border-sky-500/80 dark:focus:ring-sky-500/25 " +
    "[color-scheme:light] dark:[color-scheme:dark]";

  const statusStyles = {
    idle: "border-slate-300 bg-slate-200 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
    connecting: "border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200",
    connected: "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200",
    error: "border-rose-300 bg-rose-100 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-200"
  } satisfies Record<NonNullable<IotDeviceSelectorProps["connectionStatus"]>, string>;

  const statusLabel = {
    idle: "WebSocket inactivo",
    connecting: "WebSocket conectando",
    connected: "WebSocket conectado",
    error: connectionError ? `WebSocket con error: ${connectionError}` : "WebSocket con error"
  } satisfies Record<NonNullable<IotDeviceSelectorProps["connectionStatus"]>, string>;

  return (
    <label className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-400">
      <span className="hidden sm:inline">Dispositivo</span>
      <select
        className={selectClass}
        value={value}
        disabled={deviceIds.length === 0}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Dispositivo IoT"
      >
        {deviceIds.length === 0 ? <option value="">—</option> : null}
        {deviceIds.map((id) => (
          <option key={id} value={id}>
            {id}
          </option>
        ))}
      </select>
      <span
        className={`inline-flex h-6 items-center gap-1 rounded-lg border px-1.5 text-[9px] font-semibold ${statusStyles[connectionStatus]}`}
        title={statusLabel[connectionStatus]}
        aria-label={statusLabel[connectionStatus]}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        WS
      </span>
    </label>
  );
}
