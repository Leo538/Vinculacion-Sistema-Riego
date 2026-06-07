"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import {
  enterAPMode,
  resetDevice,
  sendGatewayCommand,
  sendRiegoCommand
} from "@/lib/api/devices";
import type { ComandoGateway, ComandoRiego } from "@/lib/api/types";
import { Card } from "@/shared/components/ui/Card";

interface CommandDef<TComando extends string> {
  comando: TComando;
  label: string;
  description: string;
  /** Si está presente, se pide confirmación antes de ejecutar (acciones disruptivas). */
  confirmMessage?: string;
  variant?: "default" | "danger";
}

const RIEGO_COMMANDS: CommandDef<ComandoRiego>[] = [
  { comando: "ENCENDER", label: "Encender riego", description: "Enciende el sistema (solo en modo manual)." },
  { comando: "APAGAR", label: "Apagar riego", description: "Apaga el sistema (solo en modo manual)." },
  { comando: "MODO_MANUAL", label: "Modo manual", description: "El riego se controla con ENCENDER/APAGAR." },
  { comando: "MODO_AUTOMATICO", label: "Modo automático", description: "La Mega decide según humedad/temperatura." }
];

const GATEWAY_COMMANDS: CommandDef<ComandoGateway>[] = [
  { comando: "STATUS", label: "Reportar estado", description: "Pide a la ESP32 que reporte su estado actual." },
  {
    comando: "AP",
    label: "Modo punto de acceso",
    description: "La ESP32 se desconecta del WiFi y abre su portal de configuración.",
    confirmMessage: "El dispositivo se desconectará de la red WiFi y abrirá su portal de configuración. ¿Continuar?",
    variant: "danger"
  },
  {
    comando: "RESET",
    label: "Borrar configuración",
    description: "Borra la configuración guardada (NVS) y reinicia en modo AP.",
    confirmMessage: "Esto borrará toda la configuración guardada del dispositivo (WiFi, MQTT, etc.) y no se puede deshacer. ¿Continuar?",
    variant: "danger"
  }
];

type FeedbackKind = "success" | "error";
interface Feedback {
  kind: FeedbackKind;
  text: string;
}

function CommandButton({
  label,
  description,
  pending,
  variant = "default",
  onClick
}: {
  label: string;
  description: string;
  pending: boolean;
  variant?: "default" | "danger";
  onClick: () => void;
}) {
  const variantClass =
    variant === "danger"
      ? "border-rose-500/40 bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 dark:text-rose-300"
      : "border-sky-500/40 bg-sky-500/10 text-sky-700 hover:bg-sky-500/20 dark:text-sky-300";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={`flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left text-[10px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variantClass}`}
    >
      <span className="inline-flex items-center gap-1.5">
        {pending ? <Loader2 className="size-3 animate-spin" strokeWidth={1.8} /> : null}
        {label}
      </span>
      <span className="text-[9px] font-normal text-slate-500 dark:text-slate-400">{description}</span>
    </button>
  );
}

/**
 * Panel de comandos para un dispositivo: riego (lo ejecuta el Mega vía
 * traducción de la ESP32) y gateway (la ESP32 se configura a sí misma).
 * Las acciones disruptivas (RESET/AP, que cortan WiFi/MQTT) piden
 * confirmación antes de publicarse por MQTT.
 */
export function DeviceCommandPanel({ deviceId }: { deviceId: string }) {
  const [pendingCommand, setPendingCommand] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const runCommand = async (key: string, action: () => Promise<void>, successText: string) => {
    setPendingCommand(key);
    setFeedback(null);
    try {
      await action();
      setFeedback({ kind: "success", text: successText });
    } catch (e) {
      setFeedback({
        kind: "error",
        text: e instanceof Error ? e.message : "No se pudo enviar el comando al dispositivo."
      });
    } finally {
      setPendingCommand(null);
    }
  };

  const handleRiego = (def: CommandDef<ComandoRiego>) => {
    void runCommand(`riego:${def.comando}`, () => sendRiegoCommand(deviceId, def.comando), `Comando "${def.label}" enviado al dispositivo ${deviceId}.`);
  };

  const handleGateway = (def: CommandDef<ComandoGateway>) => {
    if (def.confirmMessage && !window.confirm(def.confirmMessage)) return;

    const key = `gateway:${def.comando}`;
    if (def.comando === "RESET") {
      void runCommand(key, () => resetDevice(deviceId), `Dispositivo ${deviceId} iniciando borrado de configuración y reinicio en modo AP.`);
    } else if (def.comando === "AP") {
      void runCommand(key, () => enterAPMode(deviceId), `Dispositivo ${deviceId} entrando en modo punto de acceso.`);
    } else {
      void runCommand(key, () => sendGatewayCommand(deviceId, def.comando), `Comando "${def.label}" enviado al dispositivo ${deviceId}.`);
    }
  };

  return (
    <Card padding="sm" className="flex flex-col gap-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Comandos</p>
        <p className="text-[9px] text-slate-400">Se publican por MQTT en esp/comando/{deviceId || "{deviceId}"}/…</p>
      </div>

      {feedback ? (
        <p
          className={`flex items-start gap-1.5 rounded-lg border px-2 py-1.5 text-[10px] ${
            feedback.kind === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
              : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-200"
          }`}
        >
          {feedback.kind === "success" ? (
            <CheckCircle2 className="mt-0.5 size-3 shrink-0" strokeWidth={1.8} />
          ) : (
            <AlertTriangle className="mt-0.5 size-3 shrink-0" strokeWidth={1.8} />
          )}
          {feedback.text}
        </p>
      ) : null}

      <div>
        <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">Sistema de riego (Mega)</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {RIEGO_COMMANDS.map((def) => (
            <CommandButton
              key={def.comando}
              label={def.label}
              description={def.description}
              pending={pendingCommand === `riego:${def.comando}`}
              onClick={() => handleRiego(def)}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">Configuración del gateway (ESP32)</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {GATEWAY_COMMANDS.map((def) => (
            <CommandButton
              key={def.comando}
              label={def.label}
              description={def.description}
              variant={def.variant}
              pending={pendingCommand === `gateway:${def.comando}`}
              onClick={() => handleGateway(def)}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}
