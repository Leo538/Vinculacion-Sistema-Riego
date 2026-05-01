package com.uta.iot_backend.sensor.service;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uta.iot_backend.sensor.dto.SensorInfoResponse;
import com.uta.iot_backend.sensor.dto.SensorReadingResponse;
import com.uta.iot_backend.sensor.dto.SensorStatsResponse;
import com.uta.iot_backend.sensor.model.SensorMqttMessage;
import com.uta.iot_backend.sensor.model.SensorReading;
import com.uta.iot_backend.sensor.repository.SensorRepository;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SensorService {

    private static final Logger log = LoggerFactory.getLogger(SensorService.class);

    private final SensorRepository sensorRepository;

    private final ObjectMapper objectMapper;

    private final MongoTemplate mongoTemplate;

    private final SensorEventPublisher sensorEventPublisher;

    // ========================
    // MQTT — Procesamiento
    // ========================

    public void processMessage(String json) {
        try {
            SensorMqttMessage message = objectMapper.readValue(json, SensorMqttMessage.class);

            List<SensorReading> readings = message.payload().stream()
                    .map(sensor -> SensorReading.builder()
                            .deviceId(message.metadata().deviceId())
                            .sensorId(sensor.sensorId())
                            .type(sensor.type())
                            .value(sensor.value())
                            .unit(sensor.unit())
                            .timestamp(message.metadata().timestamp())
                            .build())
                    .toList();

            List<SensorReading> savedReadings = sensorRepository.saveAll(readings);
            log.info("Guardadas {} lecturas del dispositivo {}", savedReadings.size(), message.metadata().deviceId());

            // Publicar a clientes WebSocket para actualización en tiempo real
            sensorEventPublisher.publishReadings(savedReadings);

        } catch (JsonProcessingException e) {
            log.error("Error parseando JSON: {}", e.getMessage());
        }
    }

    // ========================
    // API REST — Consultas
    // ========================

    /**
     * Obtiene todas las lecturas paginadas, ordenadas por timestamp descendente.
     */
    public Page<SensorReadingResponse> getReadings(Pageable pageable) {
        return sensorRepository.findAllByOrderByTimestampDesc(pageable)
                .map(SensorReadingResponse::from);
    }

    /**
     * Obtiene la última lectura de cada sensor para un dispositivo dado.
     * Ideal para mostrar el estado actual en cards del dashboard.
     */
    public List<SensorReadingResponse> getLatestReadings(String deviceId) {
        List<SensorReading> allReadings = sensorRepository.findByDeviceIdOrderByTimestampDesc(deviceId);

        // Mantener solo la primera lectura (más reciente) por cada sensorId
        Map<String, SensorReading> latestBySensor = new LinkedHashMap<>();
        for (SensorReading reading : allReadings) {
            latestBySensor.putIfAbsent(reading.getSensorId(), reading);
        }

        return latestBySensor.values().stream()
                .map(SensorReadingResponse::from)
                .toList();
    }

    /**
     * Obtiene lecturas históricas con filtros opcionales.
     * Todos los parámetros de filtro son opcionales excepto el rango de tiempo.
     *
     * Combinaciones de filtros soportadas (en orden de prioridad):
     * 1. deviceId + sensorId → lecturas de un sensor específico en un device
     * 2. deviceId + type     → lecturas de un tipo en un device
     * 3. deviceId solo       → todas las lecturas de un device
     * 4. sensorId solo       → lecturas de un sensor en todos los devices
     * 5. type solo           → lecturas de un tipo en todos los devices
     * 6. sin filtros         → todas las lecturas (solo rango de tiempo)
     *
     * @param deviceId ID del dispositivo (opcional)
     * @param type     Tipo de sensor, e.g. "temperature" (opcional)
     * @param sensorId ID del sensor, e.g. "TMP_INT" (opcional)
     * @param from     Inicio del rango de tiempo
     * @param to       Fin del rango de tiempo
     * @param pageable Paginación
     */
    public Page<SensorReadingResponse> getHistory(
            String deviceId, String type, String sensorId,
            Instant from, Instant to, Pageable pageable) {

        Page<SensorReading> page;

        if (deviceId != null && sensorId != null) {
            page = sensorRepository.findByDeviceIdAndSensorIdAndTimestampBetween(
                    deviceId, sensorId, from, to, pageable);
        } else if (deviceId != null && type != null) {
            page = sensorRepository.findByDeviceIdAndTypeAndTimestampBetween(
                    deviceId, type, from, to, pageable);
        } else if (deviceId != null) {
            page = sensorRepository.findByDeviceIdAndTimestampBetween(
                    deviceId, from, to, pageable);
        } else if (sensorId != null) {
            page = sensorRepository.findBySensorIdAndTimestampBetween(
                    sensorId, from, to, pageable);
        } else if (type != null) {
            page = sensorRepository.findByTypeAndTimestampBetween(
                    type, from, to, pageable);
        } else {
            page = sensorRepository.findByTimestampBetween(from, to, pageable);
        }

        return page.map(SensorReadingResponse::from);
    }

    /**
     * Calcula estadísticas (min, max, avg, count) usando MongoDB Aggregation Pipeline.
     * Agrupa por sensorId, type y unit para generar un resumen por cada sensor.
     *
     * @param deviceId ID del dispositivo
     * @param sensorId ID del sensor (opcional, null = todos los sensores del device)
     * @param from     Inicio del rango de tiempo
     * @param to       Fin del rango de tiempo
     */
    public List<SensorStatsResponse> getStats(String deviceId, String sensorId, Instant from, Instant to) {
        List<Criteria> criteriaList = new ArrayList<>();
        criteriaList.add(Criteria.where("deviceId").is(deviceId));
        criteriaList.add(Criteria.where("timestamp").gte(from).lte(to));

        if (sensorId != null) {
            criteriaList.add(Criteria.where("sensorId").is(sensorId));
        }

        Criteria combinedCriteria = new Criteria().andOperator(criteriaList.toArray(new Criteria[0]));

        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(combinedCriteria),
                Aggregation.group("sensorId", "type", "unit")
                        .min("value").as("min")
                        .max("value").as("max")
                        .avg("value").as("avg")
                        .count().as("count"),
                Aggregation.project()
                        .and("_id.sensorId").as("sensorId")
                        .and("_id.type").as("type")
                        .and("_id.unit").as("unit")
                        .and("min").as("min")
                        .and("max").as("max")
                        .and("avg").as("avg")
                        .and("count").as("count")
        );

        AggregationResults<SensorStatsResponse> results =
                mongoTemplate.aggregate(aggregation, "sensor_readings", SensorStatsResponse.class);

        return results.getMappedResults();
    }

    // ========================
    // API REST — Descubrimiento
    // ========================

    /**
     * Obtiene la lista de device IDs únicos registrados en el sistema.
     * Usado para el selector de dispositivos en el dashboard.
     */
    public List<String> getDeviceIds() {
        return mongoTemplate.query(SensorReading.class)
                .distinct("deviceId")
                .as(String.class)
                .all();
    }

    /**
     * Obtiene los sensores únicos de un dispositivo (sensorId + type + unit).
     * Usado para filtros dinámicos en el dashboard.
     */
    public List<SensorInfoResponse> getSensorsForDevice(String deviceId) {
        List<SensorReading> readings = sensorRepository.findByDeviceId(deviceId);

        // Extraer combinaciones únicas de sensorId + type + unit
        Map<String, SensorInfoResponse> uniqueSensors = new LinkedHashMap<>();
        for (SensorReading reading : readings) {
            uniqueSensors.putIfAbsent(reading.getSensorId(),
                    new SensorInfoResponse(reading.getSensorId(), reading.getType(), reading.getUnit()));
        }

        return new ArrayList<>(uniqueSensors.values());
    }
}
