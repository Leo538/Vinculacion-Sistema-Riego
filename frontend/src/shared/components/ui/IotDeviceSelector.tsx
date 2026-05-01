"use client";

interface IotDeviceSelectorProps {
  deviceIds: string[];
  value: string;
  onChange: (deviceId: string) => void;
}

/** Selector de dispositivo legible en modo claro y oscuro (Dashboard, Sensores, Riego). */
export function IotDeviceSelector({ deviceIds, value, onChange }: IotDeviceSelectorProps) {
  const selectClass =
    "max-w-[10rem] cursor-pointer rounded-lg border px-2 py-1.5 text-[10px] font-medium shadow-sm outline-none transition-colors " +
    "border-slate-300 bg-white text-slate-900 " +
    "hover:border-sky-400 hover:bg-slate-50 " +
    "focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 " +
    "disabled:cursor-not-allowed disabled:opacity-55 " +
    "dark:border-slate-600/80 dark:bg-[#0f1a2a] dark:text-slate-100 dark:shadow-inner dark:hover:border-slate-500 dark:hover:bg-[#0f1a2a] " +
    "dark:focus:border-sky-500/80 dark:focus:ring-sky-500/25 " +
    "[color-scheme:light] dark:[color-scheme:dark]";

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
    </label>
  );
}
