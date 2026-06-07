#ifndef MQTT_MANAGER_H
#define MQTT_MANAGER_H

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>

class MqttManager {
public:
  void begin(const String& host, int port, const String& clientId);
  bool reconnect();
  void disconnect();
  bool publish(const String& topic, const String& payload);
  bool publishResponse(const String& payload);  // Publica en esp/respuesta/{deviceId}
  bool isConnected();
  void loop();
  void setCallback(MQTT_CALLBACK_SIGNATURE);
  void subscribeCommand(const String& topic);

private:
  WiFiClient wifiClient;
  PubSubClient mqttClient;
  String clientId;
  String deviceId;
  String host;
  int port;
  bool initialized = false;
  String cmdTopic;
};

#endif
