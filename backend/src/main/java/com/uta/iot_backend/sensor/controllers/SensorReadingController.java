package com.uta.iot_backend.sensor.controllers;

import com.uta.iot_backend.sensor.dto.ApiResponse;
import com.uta.iot_backend.sensor.dto.SensorInfoResponse;
import com.uta.iot_backend.sensor.dto.SensorReadingResponse;
import com.uta.iot_backend.sensor.dto.SensorStatsResponse;
import com.uta.iot_backend.sensor.service.SensorService;

import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * REST Controller para consulta de lecturas de sensores.
 * Base path: /api/v1
 *
 * Endpoints diseñados para alimentar un dashboard frontend con:
 * - Estado actual de sensores (latest)
 * - Histórico de lecturas con filtros (history)
 * - Estadísticas agregadas (stats)
 * - Descubrimiento de dispositivos y sensores (devices)
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class SensorReadingController {

    private final SensorService sensorService;

    // ========================
    // Lecturas
    // ========================

    /**
     * GET /api/v1/readings
     * Obtiene todas las lecturas paginadas, ordenadas por timestamp descendente.
     *
     * @param page Número de página (default: 0)
     * @param size Tamaño de página (default: 20, max: 100)
     */
    @GetMapping("/readings")
    @Operation(
            summary = "Lecturas paginadas",
            description = "Obtiene todas las lecturas ordenadas por timestamp descendente.",
            tags = {"Readings"}
    )
    public ResponseEntity<ApiResponse<Page<SensorReadingResponse>>> getReadings(
            @Parameter(description = "Numero de pagina (default: 0)", example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Tamano de pagina (default: 20, max: 100)", example = "20")
            @RequestParam(defaultValue = "20") int size) {

        size = Math.min(size, 100);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));

        Page<SensorReadingResponse> readings = sensorService.getReadings(pageable);
        return ResponseEntity.ok(ApiResponse.ok(readings));
    }

    /**
     * GET /api/v1/readings/latest?deviceId=esp32_01
     * Obtiene la última lectura de cada sensor para un dispositivo.
     * Ideal para las cards de estado actual del dashboard.
     *
     * @param deviceId ID del dispositivo (requerido)
     */
    @GetMapping("/readings/latest")
    @Operation(
            summary = "Ultima lectura por sensor",
            description = "Devuelve la lectura mas reciente de cada sensor para un dispositivo.",
            tags = {"Readings"}
    )
    public ResponseEntity<ApiResponse<List<SensorReadingResponse>>> getLatestReadings(
            @Parameter(description = "ID del dispositivo", example = "esp32_01")
            @RequestParam String deviceId) {

        List<SensorReadingResponse> readings = sensorService.getLatestReadings(deviceId);
        return ResponseEntity.ok(ApiResponse.ok(readings,
                String.format("Últimas lecturas del dispositivo %s", deviceId)));
    }

    /**
     * GET /api/v1/readings/history?deviceId=esp32_01&type=temperature&from=...&to=...
     * Obtiene lecturas históricas con filtros opcionales.
     * Diseñado para gráficos de series de tiempo.
     *
     * @param deviceId ID del dispositivo (opcional)
     * @param type     Tipo de sensor: "temperature", "humidity", etc. (opcional)
     * @param sensorId ID del sensor: "TMP_INT", "HUM_INT", etc. (opcional)
     * @param from     Inicio del rango ISO-8601, default: 24h atrás
     * @param to       Fin del rango ISO-8601, default: ahora
     * @param page     Número de página (default: 0)
     * @param size     Tamaño de página (default: 50, max: 500)
     */
    @GetMapping("/readings/history")
    @Operation(
            summary = "Historico con filtros",
            description = "Consulta historica con filtros opcionales y rango de tiempo.",
            tags = {"Readings"}
    )
    public ResponseEntity<ApiResponse<Page<SensorReadingResponse>>> getHistory(
            @Parameter(description = "ID del dispositivo", example = "esp32_01")
            @RequestParam(required = false) String deviceId,
            @Parameter(description = "Tipo de sensor", example = "temperature")
            @RequestParam(required = false) String type,
            @Parameter(description = "ID del sensor", example = "TMP_INT")
            @RequestParam(required = false) String sensorId,
            @Parameter(description = "Inicio del rango ISO-8601 (default: 24h atras)", example = "2026-04-30T06:00:00Z")
            @RequestParam(required = false) Instant from,
            @Parameter(description = "Fin del rango ISO-8601 (default: ahora)", example = "2026-04-30T12:00:00Z")
            @RequestParam(required = false) Instant to,
            @Parameter(description = "Numero de pagina (default: 0)", example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Tamano de pagina (default: 50, max: 500)", example = "50")
            @RequestParam(defaultValue = "50") int size) {

        // Defaults: últimas 24 horas
        if (from == null) from = Instant.now().minus(24, ChronoUnit.HOURS);
        if (to == null) to = Instant.now();

        size = Math.min(size, 500);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "timestamp"));

        Page<SensorReadingResponse> readings = sensorService.getHistory(
                deviceId, type, sensorId, from, to, pageable);
        return ResponseEntity.ok(ApiResponse.ok(readings));
    }

    // ========================
    // Estadísticas
    // ========================

    /**
     * GET /api/v1/readings/stats?deviceId=esp32_01&from=...&to=...
     * Calcula min, max, promedio y conteo por sensor usando MongoDB Aggregation.
     *
     * @param deviceId ID del dispositivo (requerido)
     * @param sensorId ID del sensor (opcional, null = todos)
     * @param from     Inicio del rango ISO-8601, default: 24h atrás
     * @param to       Fin del rango ISO-8601, default: ahora
     */
    @GetMapping("/readings/stats")
    @Operation(
            summary = "Estadisticas agregadas",
            description = "Calcula min, max, promedio y conteo por sensor usando agregacion MongoDB.",
            tags = {"Readings"}
    )
    public ResponseEntity<ApiResponse<List<SensorStatsResponse>>> getStats(
            @Parameter(description = "ID del dispositivo", example = "esp32_01")
            @RequestParam String deviceId,
            @Parameter(description = "ID del sensor", example = "TMP_INT")
            @RequestParam(required = false) String sensorId,
            @Parameter(description = "Inicio del rango ISO-8601 (default: 24h atras)", example = "2026-04-30T00:00:00Z")
            @RequestParam(required = false) Instant from,
            @Parameter(description = "Fin del rango ISO-8601 (default: ahora)", example = "2026-04-30T12:00:00Z")
            @RequestParam(required = false) Instant to) {

        if (from == null) from = Instant.now().minus(24, ChronoUnit.HOURS);
        if (to == null) to = Instant.now();

        List<SensorStatsResponse> stats = sensorService.getStats(deviceId, sensorId, from, to);
        return ResponseEntity.ok(ApiResponse.ok(stats,
                String.format("Estadísticas del dispositivo %s", deviceId)));
    }

    /**
     * GET /api/v1/devices
     * Lista todos los device IDs únicos registrados en el sistema.
     * Usado para el selector de dispositivos del dashboard.
     */
    @GetMapping("/devices")
    @Operation(
            summary = "Dispositivos registrados",
            description = "Lista los device IDs unicos registrados en el sistema.",
            tags = {"Devices"}
    )
    public ResponseEntity<ApiResponse<List<String>>> getDevices() {
        List<String> deviceIds = sensorService.getDeviceIds();
        return ResponseEntity.ok(ApiResponse.ok(deviceIds,
                String.format("Se encontraron %d dispositivos", deviceIds.size())));
    }

    /**
     * GET /api/v1/devices/{deviceId}/sensors
     * Lista los sensores únicos registrados para un dispositivo.
     * Devuelve sensorId, type y unit de cada sensor.
     *
     * @param deviceId ID del dispositivo
     */
    @GetMapping("/devices/{deviceId}/sensors")
    @Operation(
            summary = "Sensores por dispositivo",
            description = "Lista sensores unicos (sensorId, type, unit) de un dispositivo.",
            tags = {"Devices"}
    )
    public ResponseEntity<ApiResponse<List<SensorInfoResponse>>> getSensorsForDevice(
            @Parameter(description = "ID del dispositivo", example = "esp32_01")
            @PathVariable String deviceId) {

        List<SensorInfoResponse> sensors = sensorService.getSensorsForDevice(deviceId);
        return ResponseEntity.ok(ApiResponse.ok(sensors,
                String.format("Sensores del dispositivo %s", deviceId)));
    }
}
