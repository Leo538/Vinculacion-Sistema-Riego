package com.uta.iot_backend.sensor.dto;

import java.time.Instant;

import com.uta.iot_backend.sensor.model.SensorReading;

/**
 * DTO de respuesta para una lectura individual de sensor.
 * Mapea la entidad SensorReading a una representación limpia para la API,
 * excluyendo campos internos de MongoDB.
 */
public record SensorReadingResponse(
        String id,
        String deviceId,
        String sensorId,
        String type,
        Double value,
        String unit,
        Instant timestamp) {

    /**
     * Factory method para convertir una entidad SensorReading a su DTO de respuesta.
     */
    public static SensorReadingResponse from(SensorReading reading) {
        return new SensorReadingResponse(
                reading.getId(),
                reading.getDeviceId(),
                reading.getSensorId(),
                reading.getType(),
                reading.getValue(),
                reading.getUnit(),
                reading.getTimestamp());
    }
}
