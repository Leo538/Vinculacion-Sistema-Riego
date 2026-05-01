package com.uta.iot_backend.sensor.dto;

/**
 * DTO de respuesta para estadísticas agregadas de un sensor.
 * Contiene los valores calculados mediante MongoDB Aggregation Pipeline.
 */
public record SensorStatsResponse(
        String sensorId,
        String type,
        String unit,
        Double min,
        Double max,
        Double avg,
        Long count) {
}
