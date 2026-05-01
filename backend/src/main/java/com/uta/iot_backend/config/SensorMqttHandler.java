package com.uta.iot_backend.config;

import org.eclipse.paho.mqttv5.client.IMqttToken;
import org.eclipse.paho.mqttv5.client.MqttCallback;
import org.eclipse.paho.mqttv5.client.MqttClient;
import org.eclipse.paho.mqttv5.client.MqttDisconnectResponse;
import org.eclipse.paho.mqttv5.common.MqttException;
import org.eclipse.paho.mqttv5.common.MqttMessage;
import org.eclipse.paho.mqttv5.common.packet.MqttProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import com.uta.iot_backend.sensor.service.SensorService;

@Component
public class SensorMqttHandler implements MqttCallback {

    private static final Logger log = LoggerFactory.getLogger(SensorMqttHandler.class);

    private final MqttClient mqttClient;
    private final SensorService sensorService;

    @Value("${mqtt.topic.prefix}")
    private String topic;

    @Value("${mqtt.qos}")
    private int qos;

    public SensorMqttHandler(MqttClient mqttClient, SensorService sensorService) {
        this.mqttClient = mqttClient;
        this.sensorService = sensorService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void subscribe() throws MqttException {
        mqttClient.setCallback(this);
        mqttClient.subscribe(topic, qos);
        log.info("Suscrito a topic: {} con QoS: {}", topic, qos);
    }

    @Override
    public void messageArrived(String topic, MqttMessage message) {
        String payload = new String(message.getPayload());
        log.info("Mensaje recibido en topic: {}", topic);
        sensorService.processMessage(payload);
    }

    @Override
    public void disconnected(MqttDisconnectResponse response) {
        log.warn("Desconectado del broker: {}", response.getReasonString());
    }

    @Override
    public void connectComplete(boolean reconnect, String serverURI) {
        log.info("{} al broker: {}", reconnect ? "Reconectado" : "Conectado", serverURI);
        try {
            mqttClient.subscribe(topic, qos);
        } catch (MqttException e) {
            log.error("Error al resuscribirse: {}", e.getMessage());
        }
    }

    @Override
    public void mqttErrorOccurred(MqttException exception) {
        log.error("Error MQTT: {}", exception.getMessage());
    }

    @Override
    public void deliveryComplete(IMqttToken token) {}

    @Override
    public void authPacketArrived(int reasonCode, MqttProperties properties) {}
}