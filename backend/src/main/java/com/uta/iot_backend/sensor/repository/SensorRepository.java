package com.uta.iot_backend.sensor.repository;

import com.uta.iot_backend.sensor.model.SensorReading;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface SensorRepository extends MongoRepository<SensorReading, String> {

    List<SensorReading> findByDeviceId(String deviceId);

    /** Lecturas filtradas solo por tipo + rango de tiempo (paginadas, cross-device) */
    Page<SensorReading> findByTypeAndTimestampBetween(String type, Instant from, Instant to, Pageable pageable);

    /** Lecturas filtradas solo por sensorId + rango de tiempo (paginadas, cross-device) */
    Page<SensorReading> findBySensorIdAndTimestampBetween(String sensorId, Instant from, Instant to, Pageable pageable);

    /** Última lectura de un sensor específico dentro de un dispositivo */
    Optional<SensorReading> findTopByDeviceIdAndSensorIdOrderByTimestampDesc(String deviceId, String sensorId);

    /** Lecturas filtradas por dispositivo + tipo + rango de tiempo (paginadas) */
    Page<SensorReading> findByDeviceIdAndTypeAndTimestampBetween(
            String deviceId, String type, Instant from, Instant to, Pageable pageable);

    /** Lecturas filtradas por dispositivo + sensor + rango de tiempo (paginadas) */
    Page<SensorReading> findByDeviceIdAndSensorIdAndTimestampBetween(
            String deviceId, String sensorId, Instant from, Instant to, Pageable pageable);

    /** Lecturas filtradas solo por dispositivo + rango de tiempo (paginadas) */
    Page<SensorReading> findByDeviceIdAndTimestampBetween(
            String deviceId, Instant from, Instant to, Pageable pageable);

    /** Lecturas filtradas solo por rango de tiempo (paginadas) */
    Page<SensorReading> findByTimestampBetween(Instant from, Instant to, Pageable pageable);

    /** Todas las lecturas paginadas, ordenadas por timestamp desc */
    Page<SensorReading> findAllByOrderByTimestampDesc(Pageable pageable);

    /** Lecturas de un dispositivo, ordenadas por timestamp desc */
    List<SensorReading> findByDeviceIdOrderByTimestampDesc(String deviceId);
}
