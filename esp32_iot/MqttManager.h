#ifndef MQTT_MANAGER_H
#define MQTT_MANAGER_H

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>

class MqttManager {
public:
  void begin(const String& host, int port, const String& clientId);
  bool reconnect();
  bool publish(const String& topic, const String& payload);
  bool isConnected();
  void loop();

private:
  WiFiClient wifiClient;
  PubSubClient mqttClient;
  String clientId;
  String host;
  int port;
  bool initialized = false;
};

#endif
