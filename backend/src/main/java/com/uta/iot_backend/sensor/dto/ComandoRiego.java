package com.uta.iot_backend.sensor.dto;

/**
 * Comandos válidos para el sistema de riego (Arduino Mega).
 *
 * El nombre de cada constante viaja tal cual como payload MQTT
 * (topic {@code esp/comando/{deviceId}/riego}). El firmware del Mega
 * es legacy y no se puede modificar: solo entiende los caracteres
 * sueltos 'E'/'A'/'M'/'U' leídos byte a byte por Serial2. Por eso la
 * ESP32 actúa de traductor (ver traducirComandoRiego en esp32_iot.ino)
 * y nunca reenvía el nombre completo. Si se agrega un valor aquí,
 * debe sumarse también esa traducción en la ESP32.
 */
public enum ComandoRiego {
    ENCENDER,
    APAGAR,
    MODO_MANUAL,
    MODO_AUTOMATICO
}
