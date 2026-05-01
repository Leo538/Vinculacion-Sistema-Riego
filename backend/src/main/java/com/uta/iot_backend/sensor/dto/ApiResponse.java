package com.uta.iot_backend.sensor.dto;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Wrapper genérico para todas las respuestas de la API REST.
 * Proporciona una estructura consistente con metadata de éxito, mensaje y timestamp.
 *
 * @param <T> Tipo del payload de datos
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        boolean success,
        String message,
        T data,
        Instant timestamp) {

    /**
     * Crea una respuesta exitosa con datos.
     */
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, "OK", data, Instant.now());
    }

    /**
     * Crea una respuesta exitosa con datos y mensaje personalizado.
     */
    public static <T> ApiResponse<T> ok(T data, String message) {
        return new ApiResponse<>(true, message, data, Instant.now());
    }

    /**
     * Crea una respuesta de error sin datos.
     */
    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null, Instant.now());
    }
}
