package com.uta.iot_backend.config;

import org.eclipse.paho.mqttv5.client.MqttClient;
import org.eclipse.paho.mqttv5.client.MqttConnectionOptions;
import org.eclipse.paho.mqttv5.client.persist.MemoryPersistence;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;


@Configuration
public class MqttConfig {

    private static final Logger log = LoggerFactory.getLogger(MqttConfig.class);

    @Value("${mqtt.broker.url}")
    private String broker;

    @Value("${mqtt.client.id}")
    private String clientId;


    @Bean
    public MqttClient mqttClient() throws Exception {
        try {
            MqttClient client = new MqttClient(broker, clientId, new MemoryPersistence());
            MqttConnectionOptions options = new MqttConnectionOptions();
            options.setCleanStart(false);           
            options.setSessionExpiryInterval(3600L);
            options.setConnectionTimeout(10);
            client.connect(options);
            log.info("Conectado al broker MQTT: {}", broker);
            return client;
        } catch (Exception e) {
            log.error("No se pudo conectar al broker MQTT: {}. ¿Está Mosquitto corriendo?", e.getMessage());
            throw e;
        }
    }
}