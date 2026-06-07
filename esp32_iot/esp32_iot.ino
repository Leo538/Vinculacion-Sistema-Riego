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
#include "Comandos.h"

// ==================== PINES ====================
#define SERIAL1_RX  16
#define SERIAL1_TX  17
#define BTN_AP_PIN  0    // Botón BOOT del ESP32 para forzar modo AP
#define LED_PIN     2    // LED integrado para indicar estado

// ==================== MQTT COMANDO ====================
// Topic recibido: esp/comando/{deviceId}/<destino>
//
//   .../riego   -> comando para el sistema de riego (Arduino Mega).
//                  El Mega NO se puede modificar: su loop lee Serial2
//                  byte a byte y solo reacciona a los caracteres sueltos
//                  'E'/'A'/'M'/'U'. Por eso la ESP32 actúa de TRADUCTOR
//                  (ver traducirComandoRiego): recibe el nombre descriptivo
//                  por MQTT/REST y envía a Serial1 ÚNICAMENTE el carácter
//                  exacto que el Mega sabe interpretar -nunca la palabra
//                  completa-, porque si reenviara p. ej. "MODO_AUTOMATICO"
//                  tal cual, el Mega leería 'M' (modo manual), 'A' (apagar)
//                  y 'U' (modo automático) en cascada: tres acciones donde
//                  el usuario pidió una sola. Enrutar por TOPIC -en vez de
//                  inspeccionar el contenido para decidir destino- es lo
//                  que mantiene a la ESP32 liviana y resuelve la ambigüedad
//                  "¿esto hay que parsearlo o es un comando?": el topic ya
//                  dice qué es, y el payload solo necesita un lookup corto.
//
//   .../gateway -> comando para configurar la propia ESP32 (reset, modo AP,
//                  estado). Se valida contra el enum ComandoGateway y su
//                  ejecución se difiere a loop(): nunca se ejecuta dentro
//                  del callback MQTT porque RESET/AP desconectan WiFi/MQTT,
//                  y reentrar en ese flujo en medio de mqttClient.loop()
//                  sería inestable.
#define MQTT_CMD_PREFIX          "esp/comando"
#define MQTT_CMD_SUFFIX_RIEGO    "/riego"
#define MQTT_CMD_SUFFIX_GATEWAY  "/gateway"

// Tabla de traducción: nombre descriptivo (el que viaja por MQTT/REST,
// legible y fácil de loguear) -> único carácter que el Mega reconoce en su lectura
// de Serial2. Si el Mega algún día cambia su vocabulario, este es el ÚNICO
// lugar del firmware de la ESP32 que habría que tocar.
char traducirComandoRiego(const String& texto) {
  if (texto == "ENCENDER")        return 'E';
  if (texto == "APAGAR")          return 'A';
  if (texto == "MODO_MANUAL")     return 'M';
  if (texto == "MODO_AUTOMATICO") return 'U';
  return '\0';  // sin traducción conocida
}

// Comando de gateway pendiente: el callback MQTT solo lo arma, runPendingGatewayCommand()
// (llamado desde loop) lo ejecuta de forma segura.
ComandoGateway pendingGatewayCommand = ComandoGateway::NINGUNO;

ComandoGateway parseComandoGateway(const String& texto) {
  if (texto == "RESET")  return ComandoGateway::RESET;
  if (texto == "AP")     return ComandoGateway::AP;
  if (texto == "STATUS") return ComandoGateway::STATUS;
  return ComandoGateway::DESCONOCIDO;
}

void onCommandReceived(char* topic, byte* payload, unsigned int length) {
  String msg;
  msg.reserve(length);
  for (unsigned int i = 0; i < length; i++) {
    msg += (char)payload[i];
  }
  msg.trim();

  String topicStr(topic);
  Serial.println("[CMD] " + topicStr + " -> \"" + msg + "\"");

  if (topicStr.endsWith(MQTT_CMD_SUFFIX_RIEGO)) {
    char codigo = traducirComandoRiego(msg);
    if (codigo == '\0') {
      Serial.println("[CMD] Comando de riego no reconocido: \"" + msg + "\" (no se envía al Mega)");
    } else {
      Serial1.write(codigo);  // un solo byte: es exactamente lo que el Mega lee con Serial2.read()
      Serial.printf("[CMD] \"%s\" -> '%c' enviado al Mega por Serial1\n", msg.c_str(), codigo);
    }

  } else if (topicStr.endsWith(MQTT_CMD_SUFFIX_GATEWAY)) {
    ComandoGateway cmd = parseComandoGateway(msg);
    if (cmd == ComandoGateway::DESCONOCIDO) {
      Serial.println("[CMD] Comando de gateway desconocido: \"" + msg + "\"");
    } else {
      pendingGatewayCommand = cmd;
    }

  } else {
    Serial.println("[CMD] Topic sin destino reconocido (" + topicStr + "), se ignora");
  }
}

// Ejecuta el comando de gateway pendiente (si lo hay). Debe llamarse desde
// loop(): RESET y AP tocan WiFi/MQTT/NVS y no es seguro hacerlo dentro del
// callback de PubSubClient.
void runPendingGatewayCommand() {
  if (pendingGatewayCommand == ComandoGateway::NINGUNO) return;

  ComandoGateway cmd = pendingGatewayCommand;
  pendingGatewayCommand = ComandoGateway::NINGUNO;

  switch (cmd) {
    case ComandoGateway::RESET:  processCommand("reset");  break;
    case ComandoGateway::AP:     processCommand("ap");     break;
    case ComandoGateway::STATUS: processCommand("status"); break;
    default: break;
  }
}

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
String serialCmdBuffer = "";

// ==================== SETUP ====================
void setup() {
  // Serial para debug
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n========================================");
  Serial.println("  ESP32 IoT Gateway - Iniciando...");
  Serial.println("========================================\n");
 printHelp();
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
  handleSerialCommands();
  runPendingGatewayCommand();
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

  // Portal web disponible en modo estación
  webPortal.begin(&configMgr);

  // Conectar MQTT
  mqttMgr.begin(
    configMgr.config.mqttHost,
    configMgr.config.mqttPort,
    configMgr.config.deviceId
  );
  mqttMgr.setCallback(onCommandReceived);
  // Wildcard '#': una sola suscripción cubre .../riego y .../gateway;
  // onCommandReceived() enruta según el topic exacto de cada mensaje.
  String cmdTopic = String(MQTT_CMD_PREFIX) + "/" + configMgr.config.deviceId + "/#";
  mqttMgr.subscribeCommand(cmdTopic);  // almacena el topic; reconnect() suscribe al conectar
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


// ==================== COMANDOS SERIAL ====================

void printHelp() {
  Serial.println("\n--- Comandos disponibles (Monitor Serie) ---");
  Serial.println("  reset       → Borra toda la configuración y entra en modo AP");
  Serial.println("  ap          → Entra en modo AP sin borrar configuración");
  Serial.println("  status      → Muestra configuración y estado actual");
  Serial.println("  help        → Muestra esta ayuda");
  Serial.println("--------------------------------------------\n");
}

void processCommand(const String& cmd) {
  if (cmd == "reset") {
    Serial.println("[CMD] Borrando configuración y reiniciando modo AP...");
    String response = "{\"status\":\"resetting\",\"message\":\"Configuración borrada, iniciando modo AP\"}";
    mqttMgr.publishResponse(response);
    configMgr.clearConfig();   // borra NVS
    delay(500);
    startAPMode();

  } else if (cmd == "ap") {
    Serial.println("[CMD] Entrando en modo AP...");
    String response = "{\"status\":\"entering_ap\",\"message\":\"Entrando en modo AP\"}";
    mqttMgr.publishResponse(response);
    if (mqttMgr.isConnected()) mqttMgr.disconnect();
    WiFi.disconnect();
    delay(300);
    startAPMode();

  } else if (cmd == "status") {
    // Construir respuesta JSON con estado actual
    String response = "{";
    response += "\"wifi\":{";
    bool wifiConnected = WiFi.status() == WL_CONNECTED;
    response += "\"connected\":" + String(wifiConnected ? "true" : "false") + ",";
    if (wifiConnected) {
      response += "\"ip\":\"" + WiFi.localIP().toString() + "\",";
      response += "\"ssid\":\"" + WiFi.SSID() + "\"";
    } else {
      response += "\"ip\":\"\",";
      response += "\"ssid\":\"\"";
    }
    response += "},";
    
    response += "\"mqtt\":{";
    bool mqttConnected = mqttMgr.isConnected();
    response += "\"connected\":" + String(mqttConnected ? "true" : "false") + ",";
    response += "\"host\":\"" + configMgr.config.mqttHost + "\",";
    response += "\"port\":" + String(configMgr.config.mqttPort) + ",";
    response += "\"topic\":\"" + configMgr.config.mqttTopic + "\"";
    response += "},";
    
    response += "\"device\":{";
    response += "\"id\":\"" + configMgr.config.deviceId + "\",";
    response += "\"ap_mode\":" + String(netMgr.isAPMode() ? "true" : "false") + ",";
    response += "\"uptime_ms\":" + String(millis());
    response += "}";
    
    response += "}";
    
    Serial.println("\n--- Estado actual ---");
    configMgr.printConfig();
    Serial.println("WiFi: " + String(wifiConnected ? "Conectado → " + WiFi.localIP().toString() : "Desconectado"));
    Serial.println("MQTT: " + String(mqttConnected ? "Conectado" : "Desconectado"));
    Serial.println("Modo AP: " + String(netMgr.isAPMode() ? "Sí" : "No"));
    Serial.println("---------------------\n");
    
    mqttMgr.publishResponse(response);

  } else if (cmd == "help") {
    printHelp();

  } else {
    Serial.println("[CMD] Comando desconocido: \"" + cmd + "\". Escribe 'help' para ver los disponibles.");
  }
}

void handleSerialCommands() {
  while (Serial.available()) {
    char c = (char)Serial.read();
    if (c == '\n' || c == '\r') {
      serialCmdBuffer.trim();
      if (serialCmdBuffer.length() > 0) {
        Serial.println("[CMD] >> " + serialCmdBuffer);
        processCommand(serialCmdBuffer);
        serialCmdBuffer = "";
      }
    } else {
      serialCmdBuffer += c;
    }
  }
}
