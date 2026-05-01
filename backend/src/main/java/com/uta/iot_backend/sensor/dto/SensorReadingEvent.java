package com.uta.iot_backend.sensor.dto;

import java.time.Instant;
import java.util.List;

/**
 * Evento WebSocket que agrupa las lecturas de un mensaje MQTT.
 * Se envía como payload al frontend cuando llegan nuevos datos de un dispositivo.
 *
 * <p>Contiene el deviceId para que el frontend pueda filtrar,
 * el timestamp del evento, y la lista completa de lecturas del mensaje.</p>
 */
public record SensorReadingEvent(
        String deviceId,
        Instant timestamp,
        List<SensorReadingResponse> readings) {
}
