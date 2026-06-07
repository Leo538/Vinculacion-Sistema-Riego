package com.uta.iot_backend.sensor.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uta.iot_backend.sensor.dto.ComandoGateway;
import com.uta.iot_backend.sensor.dto.ComandoRiego;
import com.uta.iot_backend.sensor.dto.DeviceStatusResponse;
import lombok.RequiredArgsConstructor;
import org.eclipse.paho.mqttv5.client.MqttClient;
import org.eclipse.paho.mqttv5.common.MqttException;
import org.eclipse.paho.mqttv5.common.MqttMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Publica comandos hacia un dispositivo ESP32 a través de Mosquitto.
 *
 * El topic se bifurca en dos sub-rutas que la ESP32 distingue sin
 * tener que parsear el payload (ver esp32_iot.ino → onCommandReceived):
 *
 * <ul>
 *   <li>{@code esp/comando/{deviceId}/riego}   → la ESP32 traduce el nombre a
 *       un único carácter ('E'/'A'/'M'/'U') y lo envía por Serial1: el firmware
 *       del Arduino Mega es legacy (no se puede modificar) y solo entiende esos
 *       caracteres sueltos. Ver traducirComandoRiego en esp32_iot.ino.</li>
 *   <li>{@code esp/comando/{deviceId}/gateway} → la ESP32 lo ejecuta sobre sí misma
 *       (reset de configuración, modo AP, reporte de estado, etc.) y nunca
 *       llega al Mega.</li>
 * </ul>
 *
 * En ambos casos el payload publicado es el nombre de la constante del enum
 * (p. ej. "ENCENDER", "MODO_AUTOMATICO", "STATUS"): legible en MQTT/logs y a
 * la vez el contrato entre backend y ESP32 (el Mega queda fuera de ese contrato,
 * solo la ESP32 conoce su vocabulario de un solo carácter).
 */
@Service
@RequiredArgsConstructor
public class IrrigationService {

    private static final Logger log = LoggerFactory.getLogger(IrrigationService.class);

    private static final String SUBTOPIC_RIEGO = "riego";
    private static final String SUBTOPIC_GATEWAY = "gateway";

    private final MqttClient mqttClient;
    private final MqttResponseListener responseListener;
    private final ObjectMapper objectMapper;

    @Value("${mqtt.topic.command}")
    private String commandTopicPrefix;

    @Value("${mqtt.qos}")
    private int qos;

    /** Envía un comando de control del sistema de riego (lo ejecuta el Mega). */
    public void sendRiegoCommand(String deviceId, ComandoRiego comando) {
        publish(deviceId, SUBTOPIC_RIEGO, comando.name());
    }

    /** Envía un comando de configuración para la propia ESP32 (gateway). */
    public void sendGatewayCommand(String deviceId, ComandoGateway comando) {
        publish(deviceId, SUBTOPIC_GATEWAY, comando.name());
    }

    /** 
     * Solicita el estado del dispositivo y espera la respuesta por MQTT.
     * @param deviceId ID del dispositivo
     * @return DeviceStatusResponse con el estado del dispositivo
     * @throws RuntimeException si no se recibe respuesta en tiempo
     */
    public DeviceStatusResponse getDeviceStatus(String deviceId) {
        responseListener.clearCache(deviceId);
        publish(deviceId, SUBTOPIC_GATEWAY, ComandoGateway.STATUS.name());
        
        String response = responseListener.waitForResponse(deviceId);
        if (response == null) {
            throw new RuntimeException("Timeout esperando respuesta de status del dispositivo " + deviceId);
        }
        
        try {
            JsonNode json = objectMapper.readTree(response);
            return DeviceStatusResponse.fromJsonNode(json);
        } catch (Exception e) {
            log.error("Error parseando respuesta de status: {}", e.getMessage());
            throw new RuntimeException("Error procesando respuesta de status", e);
        }
    }

    /** 
     * Solicita al dispositivo que reinicie en modo AP.
     * @param deviceId ID del dispositivo
     */
    public void resetDeviceToAP(String deviceId) {
        responseListener.clearCache(deviceId);
        publish(deviceId, SUBTOPIC_GATEWAY, ComandoGateway.RESET.name());
        
        String response = responseListener.waitForResponse(deviceId);
        if (response == null) {
            log.warn("No se recibió confirmación de reset para {}", deviceId);
        } else {
            log.info("Reset confirmado para {}: {}", deviceId, response);
        }
    }

    /** 
     * Solicita al dispositivo que entre en modo AP.
     * @param deviceId ID del dispositivo
     */
    public void enterAPMode(String deviceId) {
        responseListener.clearCache(deviceId);
        publish(deviceId, SUBTOPIC_GATEWAY, ComandoGateway.AP.name());
        
        String response = responseListener.waitForResponse(deviceId);
        if (response == null) {
            log.warn("No se recibió confirmación de modo AP para {}", deviceId);
        } else {
            log.info("Modo AP confirmado para {}: {}", deviceId, response);
        }
    }

    private void publish(String deviceId, String subtopic, String payloadText) {
        String topic = commandTopicPrefix + "/" + deviceId + "/" + subtopic;
        byte[] payload = payloadText.getBytes();

        try {
            MqttMessage message = new MqttMessage(payload);
            message.setQos(qos);
            mqttClient.publish(topic, message);
            log.info("Comando publicado en {}: {}", topic, payloadText);
        } catch (MqttException e) {
            log.error("Error al publicar comando en {}: {}", topic, e.getMessage());
            throw new RuntimeException("No se pudo enviar el comando al broker MQTT", e);
        }
    }
}
