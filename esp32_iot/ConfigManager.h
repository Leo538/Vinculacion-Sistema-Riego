#ifndef CONFIG_MANAGER_H
#define CONFIG_MANAGER_H

#include <Arduino.h>
#include <Preferences.h>

struct DeviceConfig {
  // WiFi
  String wifiSsid;
  String wifiPass;

  // MQTT
  String mqttHost;
  int    mqttPort;
  String mqttTopic;

  // Device
  String deviceId;
};

class ConfigManager {
public:
  DeviceConfig config;

  void begin();
  void loadConfig();
  void saveConfig();
  void printConfig();
  void resetConfig();

private:
  Preferences prefs;
  static const char* NVS_NAMESPACE;
};

#endif
