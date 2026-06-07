#include "WebPortal.h"

void WebPortal::begin(ConfigManager* cfg) {
  configMgr = cfg;

  if (started) return;

  server.on("/", HTTP_GET, [this]() { handleRoot(); });
  server.on("/scan", HTTP_GET, [this]() { handleScan(); });
  server.on("/save", HTTP_POST, [this]() { handleSave(); });

  server.begin(80);
  started = true;
  Serial.println("[PORTAL] Servidor web iniciado en puerto 80");
}

void WebPortal::handleClient() {
  server.handleClient();
}

void WebPortal::handleRoot() {
  // Escanear redes al cargar la página
  auto networks = scanner.scanNetworks();

  String networksHtml = "";
  for (const auto& net : networks) {
    String icon = getSignalIcon(net.rssi);
    String lock = net.encrypted ? "&#128274;" : "&#128275;";
    String checked = (net.ssid == configMgr->config.wifiSsid) ? "checked" : "";

    networksHtml += "<label class='net' onclick=\"this.querySelector('input').checked=true;document.getElementById('ssid').value=this.querySelector('input').value\">";
    networksHtml += "<input type='radio' name='net' value='" + net.ssid + "' " + checked + " hidden>";
    networksHtml += "<span class='net-info'>";
    networksHtml += "<span class='net-name'>" + icon + " " + net.ssid + " " + lock + "</span>";
    networksHtml += "<span class='net-rssi'>" + String(net.rssi) + " dBm</span>";
    networksHtml += "</span></label>";
  }

  if (networks.size() == 0) {
    networksHtml = "<p style='text-align:center;color:#999'>No se encontraron redes</p>";
  }

  String page = buildPage(networksHtml, "");
  server.send(200, "text/html", page);
}

void WebPortal::handleScan() {
  // Re-escanear redes (llamado por AJAX o refresh)
  handleRoot();
}

void WebPortal::handleSave() {
  // Leer parámetros del formulario
  if (server.hasArg("ssid")) {
    configMgr->config.wifiSsid = server.arg("ssid");
  }
  if (server.hasArg("pass")) {
    configMgr->config.wifiPass = server.arg("pass");
  }
  if (server.hasArg("mqtt_host")) {
    configMgr->config.mqttHost = server.arg("mqtt_host");
  }
  if (server.hasArg("mqtt_port")) {
    configMgr->config.mqttPort = server.arg("mqtt_port").toInt();
  }
  if (server.hasArg("mqtt_topic")) {
    configMgr->config.mqttTopic = server.arg("mqtt_topic");
  }
  if (server.hasArg("device_id")) {
    configMgr->config.deviceId = server.arg("device_id");
  }

  // Guardar en NVS
  configMgr->saveConfig();
  configMgr->printConfig();

  // Mostrar confirmación
  String page = R"rawliteral(
<!DOCTYPE html>
<html lang='es'>
<head>
  <meta charset='UTF-8'>
  <meta name='viewport' content='width=device-width,initial-scale=1'>
  <title>Configuración Guardada</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#1a1a2e;color:#e4e4e7;font-family:sans-serif;
         display:flex;align-items:center;justify-content:center;height:100vh}
    .card{background:#16213e;padding:40px;border-radius:12px;text-align:center;max-width:400px}
    .icon{font-size:60px;margin-bottom:15px}
    h2{color:#00d98e;margin-bottom:10px}
    p{color:#a1a1a8;margin-bottom:20px;font-size:14px}
    .loader{border:4px solid #0f3460;border-top:4px solid #00d98e;
            border-radius:50%;width:30px;height:30px;
            animation:spin 1s linear infinite;margin:0 auto}
    @keyframes spin{to{transform:rotate(360deg)}}
  </style>
</head>
<body>
  <div class='card'>
    <div class='icon'>&#9989;</div>
    <h2>Configuración Guardada</h2>
    <p>El dispositivo se reiniciará en 3 segundos e intentará conectarse con la nueva configuración.</p>
    <div class='loader'></div>
  </div>
</body>
</html>
)rawliteral";

  server.send(200, "text/html", page);

  // Reiniciar después de enviar la respuesta
  delay(3000);
  ESP.restart();
}

String WebPortal::getSignalIcon(int rssi) {
  if (rssi > -50) return "&#9635;&#9635;&#9635;&#9635;";  // Excelente
  if (rssi > -60) return "&#9635;&#9635;&#9635;&#9633;";  // Buena
  if (rssi > -70) return "&#9635;&#9635;&#9633;&#9633;";  // Regular
  return "&#9635;&#9633;&#9633;&#9633;";                    // Débil
}

String WebPortal::buildPage(const String& networksHtml, const String& message) {
  String html = R"rawliteral(
<!DOCTYPE html>
<html lang='es'>
<head>
  <meta charset='UTF-8'>
  <meta name='viewport' content='width=device-width,initial-scale=1'>
  <title>ESP32 IoT - Configuración</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#1a1a2e;color:#e4e4e7;font-family:-apple-system,sans-serif;
         font-size:14px;padding:20px;min-height:100vh}
    .container{max-width:500px;margin:0 auto}
    h1{text-align:center;font-size:22px;margin-bottom:5px;color:#6bceff}
    .subtitle{text-align:center;color:#a1a1a8;font-size:12px;margin-bottom:25px}
    .section{background:#16213e;border-radius:10px;padding:20px;margin-bottom:15px;
             box-shadow:0 4px 6px rgba(0,0,0,.3)}
    .section-title{font-size:15px;font-weight:600;color:#6bceff;margin-bottom:12px;
                   padding-bottom:8px;border-bottom:2px solid #0f3460}
    .networks{max-height:200px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;
              margin-bottom:12px}
    .net{display:flex;align-items:center;padding:10px 12px;background:#0f3460;
         border-radius:6px;cursor:pointer;transition:all .2s}
    .net:hover{background:#1a4080;transform:translateX(3px)}
    .net input:checked+.net-info{color:#00d98e}
    .net-info{display:flex;justify-content:space-between;width:100%;align-items:center}
    .net-name{font-size:13px;font-weight:500}
    .net-rssi{font-size:11px;color:#a1a1a8}
    label.label{display:block;font-size:12px;color:#a1a1a8;text-transform:uppercase;
                letter-spacing:.5px;margin-bottom:4px;margin-top:10px}
    input[type=text],input[type=password],input[type=number]{
      width:100%;padding:10px 12px;background:#1a1a2e;border:2px solid #0f3460;
      border-radius:6px;color:#e4e4e7;font-family:monospace;font-size:13px;
      transition:border-color .3s}
    input:focus{outline:none;border-color:#6bceff;box-shadow:0 0 8px rgba(107,206,255,.2)}
    .btn-scan{display:block;width:100%;padding:8px;background:#0f3460;color:#6bceff;
              border:2px solid #6bceff;border-radius:6px;font-size:12px;cursor:pointer;
              text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;transition:all .2s}
    .btn-scan:hover{background:#6bceff;color:#1a1a2e}
    .btn-save{display:block;width:100%;padding:14px;background:#00d98e;color:#1a1a2e;
              border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;
              text-transform:uppercase;letter-spacing:1px;transition:all .2s;margin-top:10px}
    .btn-save:hover{background:#00c477;transform:translateY(-2px);
                    box-shadow:0 4px 12px rgba(0,217,142,.4)}
    .msg{padding:10px;background:rgba(0,217,142,.1);border:2px solid #00d98e;
         border-radius:6px;color:#00d98e;font-size:12px;text-align:center;margin-bottom:15px}
    ::-webkit-scrollbar{width:6px}
    ::-webkit-scrollbar-track{background:#1a1a2e;border-radius:3px}
    ::-webkit-scrollbar-thumb{background:#0f3460;border-radius:3px}
  </style>
</head>
<body>
  <div class='container'>
    <h1>&#128225; ESP32 IoT Gateway</h1>
    <p class='subtitle'>Configuración de Red y Servidor MQTT</p>
)rawliteral";

  // Mensaje de estado (si hay)
  if (message.length() > 0) {
    html += "<div class='msg'>" + message + "</div>";
  }

  html += "<form method='POST' action='/save'>";

  // Sección WiFi
  html += R"rawliteral(
    <div class='section'>
      <div class='section-title'>&#128246; Red WiFi</div>
      <button type='button' class='btn-scan' onclick="location.href='/scan'">&#128269; Escanear Redes</button>
      <div class='networks'>
)rawliteral";

  html += networksHtml;

  html += R"rawliteral(
      </div>
      <label class='label' for='ssid'>SSID</label>
      <input type='text' id='ssid' name='ssid' value=')rawliteral";
  html += configMgr->config.wifiSsid;
  html += R"rawliteral(' placeholder='Selecciona o escribe la red' required>
      <label class='label' for='pass'>Contraseña</label>
      <input type='password' id='pass' name='pass' value=')rawliteral";
  html += configMgr->config.wifiPass;
  html += R"rawliteral(' placeholder='Contraseña de la red'>
    </div>
)rawliteral";

  // Sección MQTT
  html += R"rawliteral(
    <div class='section'>
      <div class='section-title'>&#128225; Servidor MQTT</div>
      <label class='label' for='mqtt_host'>Host / IP</label>
      <input type='text' id='mqtt_host' name='mqtt_host' value=')rawliteral";
  html += configMgr->config.mqttHost;
  html += R"rawliteral(' placeholder='192.168.1.100' required>
      <label class='label' for='mqtt_port'>Puerto</label>
      <input type='number' id='mqtt_port' name='mqtt_port' value=')rawliteral";
  html += String(configMgr->config.mqttPort);
  html += R"rawliteral(' placeholder='1883' required>
      <label class='label' for='mqtt_topic'>Topic Base</label>
      <input type='text' id='mqtt_topic' name='mqtt_topic' value=')rawliteral";
  html += configMgr->config.mqttTopic;
  html += R"rawliteral(' placeholder='esp/sensores' required>
    </div>
)rawliteral";

  // Sección Device
  html += R"rawliteral(
    <div class='section'>
      <div class='section-title'>&#128187; Dispositivo</div>
      <label class='label' for='device_id'>Device ID</label>
      <input type='text' id='device_id' name='device_id' value=')rawliteral";
  html += configMgr->config.deviceId;
  html += R"rawliteral(' placeholder='esp32_01' required>
    </div>
    <button type='submit' class='btn-save'>&#128190; Guardar y Reiniciar</button>
  </form>
  </div>
</body>
</html>
)rawliteral";

  return html;
}
