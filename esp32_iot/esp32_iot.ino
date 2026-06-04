/*
 * ESP32 IoT - Puente Arduino Mega → MQTT → Spring Boot
 * 
 * Flujo:
 *   Arduino Mega (Serial1) → ESP32 (parsea) → MQTT (publica JSON) → Spring Boot → MongoDB
 * 
 * Librerías necesarias (instalar desde Arduino IDE Library Manager):
 *   - PubSubClient (by Nick O'Leary)
 *   - ArduinoJson (by Benoit Blanchon, v7+)
 * 
 * Pines Serial1 (comunicación con Arduino Mega):
 *   ESP32 RX (GPIO16) ← Mega TX1
 *   ESP32 TX (GPIO17) → Mega RX1
 *   GND ↔ GND (compartir tierra)
 * 
 * Formato de datos del Mega:
 *   sensorId:type:valor:unidad\n
 *   ...
 *   END\n
 * 
 * Ejemplo:
 *   TMP_INT:temperature:32.1:°C
 *   TMP_EXT:temperature:22.5:°C
 *   HUM_INT:humidity:60.2:%
 *   END
 */

#include <WiFi.h>
#include <WebServer.h>
#include <Preferences.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <time.h>

#include "ConfigManager.h"
#include "NetManager.h"
#include "MqttManager.h"
#include "SerialParser.h"
#include "WebPortal.h"

// ==================== PINES ====================
#define SERIAL1_RX  16
#define SERIAL1_TX  17
#define BTN_AP_PIN  0    // Botón BOOT del ESP32 para forzar modo AP
#define LED_PIN     2    // LED integrado para indicar estado

// ==================== OBJETOS GLOBALES ====================
ConfigManager configMgr;
NetManager    netMgr;
MqttManager   mqttMgr;
SerialParser  serialParser;
WebPortal     webPortal;

// ==================== VARIABLES ====================
unsigned long lastMqttReconnect = 0;
unsigned long ledBlinkTimer = 0;
bool ledState = false;

// ==================== SETUP ====================
void setup() {
  // Serial para debug
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n========================================");
  Serial.println("  ESP32 IoT Gateway - Iniciando...");
  Serial.println("========================================\n");

  // Serial1 para comunicación con Arduino Mega
  Serial1.begin(115200, SERIAL_8N1, SERIAL1_RX, SERIAL1_TX);
  Serial.println("[SERIAL] Serial1 iniciado (9600 baud, RX:" + String(SERIAL1_RX) + " TX:" + String(SERIAL1_TX) + ")");

  // Pines
  pinMode(BTN_AP_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // Cargar configuración desde NVS
  configMgr.begin();
  configMgr.loadConfig();
  configMgr.printConfig();

  // Verificar si se forzó modo AP (botón presionado al encender)
  if (digitalRead(BTN_AP_PIN) == LOW) {
    Serial.println("\n[AP] Botón AP presionado. Forzando modo configuración...");
    delay(500);
    startAPMode();
    return;
  }

  // Intentar conectar WiFi
  if (configMgr.config.wifiSsid.length() > 0) {
    bool connected = netMgr.connectWiFi(
      configMgr.config.wifiSsid,
      configMgr.config.wifiPass,
      5  // máximo 5 intentos
    );

    if (connected) {
      Serial.println("[WIFI] IP: " + WiFi.localIP().toString());
      onWiFiConnected();
    } else {
      Serial.println("[WIFI] No se pudo conectar después de 5 intentos");
      startAPMode();
    }
  } else {
    Serial.println("[CONFIG] No hay WiFi configurado");
    startAPMode();
  }
}

// ==================== LOOP ====================
void loop() {
  // Si está en modo AP, manejar el portal web
  if (netMgr.isAPMode()) {
    webPortal.handleClient();
    blinkLed(200);  // Parpadeo rápido = modo AP
    return;
  }

  // Verificar conexión WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WIFI] Conexión perdida. Reintentando...");
    blinkLed(500);  // Parpadeo medio = sin WiFi

    bool reconnected = netMgr.connectWiFi(
      configMgr.config.wifiSsid,
      configMgr.config.wifiPass,
      5
    );

    if (!reconnected) {
      Serial.println("[WIFI] Reconexión fallida. Entrando en modo AP...");
      startAPMode();
      return;
    }
    onWiFiConnected();
  }

  // Mantener conexión MQTT
  if (!mqttMgr.isConnected()) {
    unsigned long now = millis();
    if (now - lastMqttReconnect > 5000) {
      lastMqttReconnect = now;
      mqttMgr.reconnect();
    }
    blinkLed(1000);  // Parpadeo lento = sin MQTT
  } else {
    digitalWrite(LED_PIN, HIGH);  // LED fijo = todo OK
    mqttMgr.loop();
  }
  // === DEBUG: Leer desde monitor serial para pruebas ===
  if (serialParser.readSerial(Serial)) {
      std::vector<SensorData> readings = serialParser.getReadings();
  
      if (readings.size() > 0) {
        String timestamp = getTimestamp();
        String json = buildJson(configMgr.config.deviceId, timestamp, readings);
        Serial.println("[JSON] " + json);
  
        String topic = configMgr.config.mqttTopic + "/" + configMgr.config.deviceId;
        if (mqttMgr.publish(topic, json)) {
          Serial.println("[MQTT] Publicado en: " + topic);
        } else {
          Serial.println("[MQTT] Error al publicar");
        }
      }
      serialParser.clearReadings();
  }
  // === FIN DEBUG ===
  // Leer datos del Arduino Mega por Serial1
  if (serialParser.readSerial(Serial1)) {
    // Hay una trama completa lista
    std::vector<SensorData> readings = serialParser.getReadings();

    if (readings.size() > 0) {
      // Obtener timestamp NTP
      String timestamp = getTimestamp();

      // Construir JSON
      String json = buildJson(configMgr.config.deviceId, timestamp, readings);
      Serial.println("[JSON] " + json);

      // Publicar por MQTT
      String topic = configMgr.config.mqttTopic + "/" + configMgr.config.deviceId;
      if (mqttMgr.publish(topic, json)) {
        Serial.println("[MQTT] Publicado en: " + topic);
      } else {
        Serial.println("[MQTT] Error al publicar");
      }
    }

    serialParser.clearReadings();
  }
}

// ==================== FUNCIONES AUXILIARES ====================

void onWiFiConnected() {
  // Sincronizar hora NTP
  configTzTime("UTC", "pool.ntp.org", "time.nist.gov");
  Serial.println("[NTP] Sincronizando hora...");

  // Esperar sincronización (máx 10 segundos)
  int ntpRetries = 0;
  while (time(nullptr) < 1000000 && ntpRetries < 20) {
    delay(500);
    ntpRetries++;
  }

  if (time(nullptr) > 1000000) {
    Serial.println("[NTP] Hora sincronizada: " + getTimestamp());
  } else {
    Serial.println("[NTP] No se pudo sincronizar la hora");
  }

  // Conectar MQTT
  mqttMgr.begin(
    configMgr.config.mqttHost,
    configMgr.config.mqttPort,
    configMgr.config.deviceId
  );
  mqttMgr.reconnect();
}

void startAPMode() {
  netMgr.startAP(configMgr.config.deviceId);
  webPortal.begin(&configMgr);
  Serial.println("[AP] Portal de configuración activo en http://192.168.4.1");
}

String getTimestamp() {
  time_t now = time(nullptr);
  struct tm timeinfo;
  gmtime_r(&now, &timeinfo);

  char buf[30];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(buf);
}

String buildJson(const String& deviceId, const String& timestamp, const std::vector<SensorData>& readings) {
  JsonDocument doc;

  // Metadata
  JsonObject metadata = doc["metadata"].to<JsonObject>();
  metadata["deviceId"] = deviceId;
  metadata["timestamp"] = timestamp;

  // Payload array
  JsonArray payload = doc["payload"].to<JsonArray>();
  for (const auto& r : readings) {
    JsonObject sensor = payload.add<JsonObject>();
    sensor["sensorId"] = r.sensorId;
    sensor["type"] = r.type;
    sensor["value"] = r.value;
    sensor["unit"] = r.unit;
  }

  String output;
  serializeJson(doc, output);
  return output;
}

void blinkLed(unsigned long interval) {
  unsigned long now = millis();
  if (now - ledBlinkTimer > interval) {
    ledBlinkTimer = now;
    ledState = !ledState;
    digitalWrite(LED_PIN, ledState);
  }
}
