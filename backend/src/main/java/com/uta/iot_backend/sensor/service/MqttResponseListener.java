package com.uta.iot_backend.sensor.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Almacena temporalmente las respuestas MQTT de los dispositivos ESP32.
 * Las respuestas se publican en: esp/respuesta/{deviceId}
 * 
 * El SensorMqttHandler delega los mensajes de este topic a este componente.
 */
@Component
public class MqttResponseListener {

    private static final Logger log = LoggerFactory.getLogger(MqttResponseListener.class);
    private static final long RESPONSE_TIMEOUT_MS = 5000;  // 5 segundos de timeout

    private final Map<String, String> responseCache = new ConcurrentHashMap<>();

    /**
     * Almacena una respuesta recibida del dispositivo.
     * Llamado desde SensorMqttHandler cuando recibe un mensaje en esp/respuesta/{deviceId}
     */
    public void storeResponse(String deviceId, String payload) {
        responseCache.put(deviceId, payload);
        log.debug("Respuesta almacenada para {}: {}", deviceId, payload);
    }

    /**
     * Obtiene la respuesta de un dispositivo, esperando hasta RESPONSE_TIMEOUT_MS.
     * @param deviceId ID del dispositivo
     * @return El payload JSON de la respuesta, o null si no se recibió respuesta en tiempo
     */
    public String waitForResponse(String deviceId) {
        long startTime = System.currentTimeMillis();
        
        while (System.currentTimeMillis() - startTime < RESPONSE_TIMEOUT_MS) {
            String response = responseCache.get(deviceId);
            if (response != null) {
                responseCache.remove(deviceId);
                return response;
            }
            
            try {
                Thread.sleep(100);  // Esperar 100ms antes de volver a intentar
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.warn("Interrupción esperando respuesta de {}", deviceId);
                break;
            }
        }
        
        log.warn("Timeout esperando respuesta de {} ({}ms)", deviceId, RESPONSE_TIMEOUT_MS);
        return null;
    }

    public void clearCache(String deviceId) {
        responseCache.remove(deviceId);
    }
}
