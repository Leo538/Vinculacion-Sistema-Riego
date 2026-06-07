#ifndef WEB_PORTAL_H
#define WEB_PORTAL_H

#include <Arduino.h>
#include <WebServer.h>
#include "ConfigManager.h"
#include "NetManager.h"

class WebPortal {
public:
  void begin(ConfigManager* configMgr);
  void handleClient();

private:
  WebServer server;
  ConfigManager* configMgr;
  NetManager scanner;
  bool started = false;

  void handleRoot();
  void handleScan();
  void handleSave();
  String buildPage(const String& networksHtml, const String& message);
  String getSignalIcon(int rssi);
};

#endif
