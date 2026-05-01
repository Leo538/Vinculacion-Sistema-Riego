package com.uta.iot_backend.sensor.model;

import java.time.Instant;
import java.util.List;

public record SensorMqttMessage(
                Metadata metadata,
                List<SensorPayload> payload) {
        public record Metadata(
                        String deviceId,
                        Instant timestamp) {
        }

        public record SensorPayload(
                        String sensorId,
                        String type,
                        Double value,
                        String unit) {
        }
}