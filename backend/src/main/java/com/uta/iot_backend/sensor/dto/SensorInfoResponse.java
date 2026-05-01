package com.uta.iot_backend.sensor.dto;

/**
 * DTO que describe un sensor registrado dentro de un dispositivo.
 * Usado para descubrimiento dinámico de sensores en el dashboard.
 */
public record SensorInfoResponse(
        String sensorId,
        String type,
        String unit) {
}
