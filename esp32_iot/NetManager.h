#ifndef NET_MANAGER_H
#define NET_MANAGER_H

#include <Arduino.h>
#include <WiFi.h>
#include <vector>      
#include <algorithm>  

struct WiFiNetwork {
  String ssid;
  int    rssi;
  bool   encrypted;
};

class NetManager {
public:
  bool connectWiFi(const String& ssid, const String& password, int maxRetries);
  void startAP(const String& deviceId);
  void stopAP();
  bool isAPMode();
  std::vector<WiFiNetwork> scanNetworks();

private:
  bool apMode = false;
};

#endif
