#include "NetManager.h"

bool NetManager::connectWiFi(const String& ssid, const String& password, int maxRetries) {
  if (ssid.length() == 0) return false;

  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  delay(100);

  Serial.println("[WIFI] Conectando a: " + ssid);

  for (int attempt = 1; attempt <= maxRetries; attempt++) {
    Serial.printf("[WIFI] Intento %d/%d...\n", attempt, maxRetries);

    WiFi.begin(ssid.c_str(), password.c_str());

    // Esperar conexión (máx 10 segundos por intento)
    int timeout = 0;
    while (WiFi.status() != WL_CONNECTED && timeout < 20) {
      delay(500);
      Serial.print(".");
      timeout++;
    }
    Serial.println();

    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("[WIFI] Conectado exitosamente");
      Serial.println("[WIFI] IP: " + WiFi.localIP().toString());
      Serial.println("[WIFI] RSSI: " + String(WiFi.RSSI()) + " dBm");
      apMode = false;
      return true;
    }

    Serial.println("[WIFI] Intento fallido");
    WiFi.disconnect();
    delay(1000);
  }

  return false;
}

void NetManager::startAP(const String& deviceId) {
  WiFi.disconnect();
  WiFi.mode(WIFI_AP);

  String apName = "ESP32_IoT_" + deviceId;
  WiFi.softAP(apName.c_str());

  delay(500);
  apMode = true;

  Serial.println("[AP] Punto de acceso iniciado");
  Serial.println("[AP] SSID: " + apName);
  Serial.println("[AP] IP: " + WiFi.softAPIP().toString());
}

void NetManager::stopAP() {
  WiFi.softAPdisconnect(true);
  apMode = false;
}

bool NetManager::isAPMode() {
  return apMode;
}

std::vector<WiFiNetwork> NetManager::scanNetworks() {
  std::vector<WiFiNetwork> networks;

  Serial.println("[WIFI] Escaneando redes...");
  int n = WiFi.scanNetworks();

  for (int i = 0; i < n; i++) {
    WiFiNetwork net;
    net.ssid = WiFi.SSID(i);
    net.rssi = WiFi.RSSI(i);
    net.encrypted = (WiFi.encryptionType(i) != WIFI_AUTH_OPEN);

    // Evitar duplicados
    bool duplicate = false;
    for (const auto& existing : networks) {
      if (existing.ssid == net.ssid) {
        duplicate = true;
        break;
      }
    }

    if (!duplicate && net.ssid.length() > 0) {
      networks.push_back(net);
    }
  }

  // Ordenar por señal (mayor RSSI primero)
  std::sort(networks.begin(), networks.end(), [](const WiFiNetwork& a, const WiFiNetwork& b) {
    return a.rssi > b.rssi;
  });

  Serial.printf("[WIFI] %d redes encontradas\n", networks.size());
  WiFi.scanDelete();

  return networks;
}
