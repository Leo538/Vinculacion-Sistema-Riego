#include "ConfigManager.h"

const char* ConfigManager::NVS_NAMESPACE = "iot_config";

void ConfigManager::begin() {
  prefs.begin(NVS_NAMESPACE, false);
}

void ConfigManager::loadConfig() {
  config.wifiSsid  = prefs.getString("wifi_ssid", "");
  config.wifiPass  = prefs.getString("wifi_pass", "");
  config.mqttHost  = prefs.getString("mqtt_host", "192.168.1.100");
  config.mqttPort  = prefs.getInt("mqtt_port", 1883);
  config.mqttTopic = prefs.getString("mqtt_topic", "esp/sensores");
  config.deviceId  = prefs.getString("device_id", "esp32_01");
}

void ConfigManager::saveConfig() {
  prefs.putString("wifi_ssid", config.wifiSsid);
  prefs.putString("wifi_pass", config.wifiPass);
  prefs.putString("mqtt_host", config.mqttHost);
  prefs.putInt("mqtt_port", config.mqttPort);
  prefs.putString("mqtt_topic", config.mqttTopic);
  prefs.putString("device_id", config.deviceId);
  Serial.println("[CONFIG] Configuración guardada en NVS");
}

void ConfigManager::printConfig() {
  Serial.println("[CONFIG] Configuración actual:");
  Serial.println("  WiFi SSID:  " + config.wifiSsid);
  Serial.println("  WiFi Pass:  " + String(config.wifiPass.length() > 0 ? "****" : "(vacío)"));
  Serial.println("  MQTT Host:  " + config.mqttHost);
  Serial.println("  MQTT Port:  " + String(config.mqttPort));
  Serial.println("  MQTT Topic: " + config.mqttTopic);
  Serial.println("  Device ID:  " + config.deviceId);
}

void ConfigManager::resetConfig() {
  prefs.clear();
  loadConfig();  // Recarga defaults
  Serial.println("[CONFIG] Configuración reseteada a valores por defecto");
}

void ConfigManager::clearConfig() {
  prefs.begin(NVS_NAMESPACE, false);
  prefs.clear();
  prefs.end();
  Serial.println("[CONFIG] NVS borrado.");
}