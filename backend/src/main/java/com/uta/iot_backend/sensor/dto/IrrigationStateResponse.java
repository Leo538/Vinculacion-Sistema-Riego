package com.uta.iot_backend.sensor.dto;

import java.time.Instant;

/**
 * Estado actual del sistema de riego controlado por el Arduino Mega.
 *
 * Se construye a partir de tres "sensores" especiales que la Mega agrega
 * al final de cada paquete periódico (ver mega.txt → loop, sección
 * "Enviar Estado del Sistema de Riego"):
 *
 * <ul>
 *   <li>{@code estado_sistema} (bool, 1/0)  → {@link #encendido()}</li>
 *   <li>{@code modo_riego}     (bool, 1/0)  → {@link #modoAutomatico()}</li>
 *   <li>{@code ultimo_comando} (char, código ASCII de 'E'/'A'/'M'/'U') → {@link #ultimoComando()}</li>
 * </ul>
 */
public record IrrigationStateResponse(
        boolean encendido,
        boolean modoAutomatico,
        String ultimoComando,
        Instant timestamp
) {
    public static final String SENSOR_ID_ESTADO = "estado_sistema";
    public static final String SENSOR_ID_MODO = "modo_riego";
    public static final String SENSOR_ID_ULTIMO_COMANDO = "ultimo_comando";

    /** Traduce el código ASCII enviado por la Mega a la letra de comando original. */
    public static String decodeUltimoComando(double asciiCode) {
        char c = (char) Math.round(asciiCode);
        return switch (c) {
            case 'E', 'A', 'M', 'U' -> String.valueOf(c);
            default -> "DESCONOCIDO";
        };
    }
}
