package com.uta.iot_backend.sensor.dto;

/**
 * Comandos válidos para configurar la propia ESP32 (gateway), en
 * lugar del sistema de riego que cuelga de ella por Serial1.
 *
 * El nombre de cada constante viaja tal cual como payload MQTT
 * (topic {@code esp/comando/{deviceId}/gateway}); la ESP32 lo
 * interpreta localmente y nunca lo reenvía al Mega.
 */
public enum ComandoGateway {
    /** Borra la configuración guardada (NVS) y reinicia en modo AP. */
    RESET,
    /** Entra en modo punto de acceso sin borrar la configuración. */
    AP,
    /** Publica el estado actual (config, WiFi, MQTT) en el log de la ESP32. */
    STATUS
}
