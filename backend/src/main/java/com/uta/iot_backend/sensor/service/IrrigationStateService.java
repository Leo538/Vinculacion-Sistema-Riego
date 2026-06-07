package com.uta.iot_backend.sensor.service;

import com.uta.iot_backend.sensor.dto.IrrigationStateResponse;
import com.uta.iot_backend.sensor.model.SensorReading;
import com.uta.iot_backend.sensor.repository.SensorRepository;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Mantiene el último estado conocido del sistema de riego (Arduino Mega) por
 * dispositivo, derivado de los "sensores" especiales que la Mega agrega a su
 * paquete periódico ({@code estado_sistema}, {@code modo_riego},
 * {@code ultimo_comando}, ver {@link IrrigationStateResponse}).
 *
 * No abre una suscripción MQTT propia: estos valores ya llegan por el flujo
 * normal de lecturas (Mega → ESP32 → MQTT → {@link SensorService#processMessage}),
 * así que este servicio solo los detecta entre las lecturas recién guardadas,
 * arma el DTO y lo cachea/empuja por WebSocket en el topic dedicado.
 */
@Service
@RequiredArgsConstructor
public class IrrigationStateService {

    private static final Logger log = LoggerFactory.getLogger(IrrigationStateService.class);

    private static final String WS_TOPIC_TEMPLATE = "/topic/devices/%s/riego/estado";

    private final SensorRepository sensorRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private final Map<String, IrrigationStateResponse> latestStateByDevice = new ConcurrentHashMap<>();

    /**
     * Revisa las lecturas recién persistidas; si incluyen alguno de los tres
     * sensores de estado de riego, recalcula el estado del dispositivo, lo
     * cachea y lo publica por WebSocket.
     *
     * Llamado desde {@link SensorService#processMessage(String)} justo después
     * de guardar en MongoDB.
     */
    public void onReadingsSaved(List<SensorReading> savedReadings) {
        if (savedReadings == null || savedReadings.isEmpty()) {
            return;
        }

        boolean hasIrrigationState = savedReadings.stream().anyMatch(IrrigationStateService::isIrrigationStateSensor);
        if (!hasIrrigationState) {
            return;
        }

        String deviceId = savedReadings.getFirst().getDeviceId();
        refreshAndPublish(deviceId);
    }

    /**
     * Devuelve el estado actual del dispositivo: primero la caché en memoria
     * (alimentada por el stream MQTT) y, si todavía no hay nada cacheado
     * (p. ej. recién arrancó el backend), lo reconstruye desde Mongo con la
     * última lectura de cada uno de los tres sensores de estado.
     */
    public Optional<IrrigationStateResponse> getState(String deviceId) {
        IrrigationStateResponse cached = latestStateByDevice.get(deviceId);
        if (cached != null) {
            return Optional.of(cached);
        }
        return buildStateFromRepository(deviceId);
    }

    private void refreshAndPublish(String deviceId) {
        buildStateFromRepository(deviceId).ifPresent(state -> {
            latestStateByDevice.put(deviceId, state);
            messagingTemplate.convertAndSend(String.format(WS_TOPIC_TEMPLATE, deviceId), state);
            log.debug("Estado de riego actualizado para {}: {}", deviceId, state);
        });
    }

    private Optional<IrrigationStateResponse> buildStateFromRepository(String deviceId) {
        SensorReading estado = latestReadingOf(deviceId, IrrigationStateResponse.SENSOR_ID_ESTADO);
        SensorReading modo = latestReadingOf(deviceId, IrrigationStateResponse.SENSOR_ID_MODO);
        SensorReading ultimoComando = latestReadingOf(deviceId, IrrigationStateResponse.SENSOR_ID_ULTIMO_COMANDO);

        if (estado == null || modo == null || ultimoComando == null) {
            return Optional.empty();
        }

        Instant timestamp = List.of(estado, modo, ultimoComando).stream()
                .map(SensorReading::getTimestamp)
                .max(Instant::compareTo)
                .orElse(Instant.now());

        return Optional.of(new IrrigationStateResponse(
                estado.getValue() >= 0.5,
                modo.getValue() >= 0.5,
                IrrigationStateResponse.decodeUltimoComando(ultimoComando.getValue()),
                timestamp
        ));
    }

    private SensorReading latestReadingOf(String deviceId, String sensorId) {
        return sensorRepository
                .findTopByDeviceIdAndSensorIdOrderByTimestampDesc(deviceId, sensorId)
                .orElse(null);
    }

    private static boolean isIrrigationStateSensor(SensorReading reading) {
        String sensorId = reading.getSensorId();
        return IrrigationStateResponse.SENSOR_ID_ESTADO.equals(sensorId)
                || IrrigationStateResponse.SENSOR_ID_MODO.equals(sensorId)
                || IrrigationStateResponse.SENSOR_ID_ULTIMO_COMANDO.equals(sensorId);
    }
}
