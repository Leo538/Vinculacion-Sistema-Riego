package com.uta.iot_backend.sensor.service;

import com.uta.iot_backend.sensor.dto.SensorReadingEvent;
import com.uta.iot_backend.sensor.dto.SensorReadingResponse;
import com.uta.iot_backend.sensor.model.SensorReading;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

/**
 * Servicio encargado de publicar lecturas de sensores a los clientes WebSocket conectados.
 *
 * <h3>Topics de publicación:</h3>
 * <ul>
 *   <li>{@code /topic/readings/live} — Feed global con todas las lecturas nuevas</li>
 *   <li>{@code /topic/devices/{deviceId}/readings} — Lecturas filtradas por dispositivo</li>
 *   <li>{@code /topic/devices/{deviceId}/sensors/{sensorId}} — Lectura individual de un sensor específico</li>
 * </ul>
 *
 * <p>El frontend se suscribe al topic que necesite según la vista del dashboard:</p>
 * <ul>
 *   <li>Vista general → {@code /topic/readings/live}</li>
 *   <li>Dashboard de un device → {@code /topic/devices/esp32_01/readings}</li>
 *   <li>Widget de un sensor → {@code /topic/devices/esp32_01/sensors/TMP_INT}</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class SensorEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(SensorEventPublisher.class);

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Publica las lecturas recién guardadas a todos los topics WebSocket relevantes.
     * Se invoca desde {@link SensorService#processMessage(String)} después de persistir en MongoDB.
     *
     * @param savedReadings Lista de lecturas recién persistidas en la base de datos
     */
    public void publishReadings(List<SensorReading> savedReadings) {
        if (savedReadings == null || savedReadings.isEmpty()) {
            return;
        }

        String deviceId = savedReadings.getFirst().getDeviceId();
        Instant timestamp = savedReadings.getFirst().getTimestamp();

        List<SensorReadingResponse> responses = savedReadings.stream()
                .map(SensorReadingResponse::from)
                .toList();

        // 1. Feed global — todas las lecturas nuevas agrupadas por mensaje MQTT
        SensorReadingEvent event = new SensorReadingEvent(deviceId, timestamp, responses);
        messagingTemplate.convertAndSend("/topic/readings/live", event);

        // 2. Feed por dispositivo — para dashboards que monitorean un device específico
        messagingTemplate.convertAndSend(
                String.format("/topic/devices/%s/readings", deviceId), event);

        // 3. Feed por sensor individual — para widgets/gauges de un sensor específico
        for (SensorReadingResponse response : responses) {
            messagingTemplate.convertAndSend(
                    String.format("/topic/devices/%s/sensors/%s", deviceId, response.sensorId()),
                    response);
        }

        log.debug("Publicadas {} lecturas WebSocket del dispositivo {}", responses.size(), deviceId);
    }
}
