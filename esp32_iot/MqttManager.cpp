#include "MqttManager.h"

void MqttManager::begin(const String& host, int port, const String& clientId) {
  this->host = host;
  this->port = port;
  this->clientId = clientId;
  this->deviceId = clientId;  // El deviceId es el clientId

  mqttClient.setClient(wifiClient);
  mqttClient.setServer(host.c_str(), port);
  mqttClient.setBufferSize(1024);  // Aumentar buffer para JSONs grandes

  initialized = true;
  Serial.printf("[MQTT] Configurado: %s:%d (clientId: %s)\n", host.c_str(), port, clientId.c_str());
}

bool MqttManager::reconnect() {
  if (!initialized) return false;

  if (mqttClient.connected()) return true;

  Serial.println("[MQTT] Conectando al broker...");

  if (mqttClient.connect(clientId.c_str())) {
    Serial.println("[MQTT] Conectado exitosamente");
    if (!cmdTopic.isEmpty()) {
      mqttClient.subscribe(cmdTopic.c_str());
      Serial.println("[MQTT] Suscrito a: " + cmdTopic);
    }
    return true;
  } else {
    int state = mqttClient.state();
    Serial.printf("[MQTT] Error de conexión, código: %d\n", state);

    switch (state) {
      case -1: Serial.println("[MQTT] Timeout de conexión"); break;
      case -2: Serial.println("[MQTT] Conexión rechazada por el servidor"); break;
      case -3: Serial.println("[MQTT] Servidor no disponible"); break;
      case -4: Serial.println("[MQTT] Credenciales inválidas"); break;
      default: Serial.println("[MQTT] Error desconocido"); break;
    }
    return false;
  }
}

bool MqttManager::publish(const String& topic, const String& payload) {
  if (!mqttClient.connected()) {
    Serial.println("[MQTT] No conectado, no se puede publicar");
    return false;
  }

  // Publicar con QoS 1 (retained = false)
  // PubSubClient no soporta QoS 1 nativamente en publish(),
  // pero sí envía el paquete PUBLISH con QoS en el flag
  bool result = mqttClient.publish(topic.c_str(), payload.c_str(), false);

  if (result) {
    Serial.printf("[MQTT] Publicado (%d bytes) en %s\n", payload.length(), topic.c_str());
  } else {
    Serial.println("[MQTT] Error al publicar, buffer insuficiente o desconectado");
  }

  return result;
}

void MqttManager::disconnect() {
  if (initialized) mqttClient.disconnect();
}

bool MqttManager::isConnected() {
  return initialized && mqttClient.connected();
}

void MqttManager::loop() {
  if (initialized) {
    mqttClient.loop();
  }
}

void MqttManager::setCallback(MQTT_CALLBACK_SIGNATURE) {
  mqttClient.setCallback(callback);
}

void MqttManager::subscribeCommand(const String& topic) {
  cmdTopic = topic;
  if (mqttClient.connected()) {
    mqttClient.subscribe(topic.c_str());
    Serial.println("[MQTT] Suscrito a: " + topic);
  }
}

bool MqttManager::publishResponse(const String& payload) {
  if (!isConnected()) return false;
  
  String topic = "esp/respuesta/" + deviceId;
  bool success = mqttClient.publish(topic.c_str(), payload.c_str());
  
  if (success) {
    Serial.println("[MQTT] Respuesta publicada en: " + topic);
  } else {
    Serial.println("[MQTT] Error publicando respuesta en: " + topic);
  }
  
  return success;
}
