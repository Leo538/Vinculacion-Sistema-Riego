#include "SerialParser.h"

bool SerialParser::readSerial(HardwareSerial& serial) {
  frameReady = false;

  while (serial.available()) {
    char c = serial.read();

    if (c == '\n' || c == '\r') {
      lineBuffer.trim();

      if (lineBuffer.length() == 0) {
        continue;  // Línea vacía, ignorar
      }

      if (lineBuffer == "END") {
        // Fin de trama
        if (readings.size() > 0) {
          frameReady = true;
          Serial.printf("[SERIAL] Trama completa: %d lecturas\n", readings.size());
        }
        lineBuffer = "";
        return frameReady;
      }

      // Parsear línea de datos
      if (parseLine(lineBuffer)) {
        Serial.println("[SERIAL] Parseado: " + lineBuffer);
      } else {
        Serial.println("[SERIAL] Error parseando: " + lineBuffer);
      }

      lineBuffer = "";
    } else {
      lineBuffer += c;

      // Protección contra overflow
      if (lineBuffer.length() > 200) {
        Serial.println("[SERIAL] Línea demasiado larga, descartando");
        lineBuffer = "";
      }
    }
  }

  return false;
}

bool SerialParser::parseLine(const String& line) {
  // Formato esperado: sensorId:type:valor:unidad
  // Ejemplo: TMP_INT:temperature:32.1:°C

  int firstColon = line.indexOf(':');
  if (firstColon < 0) return false;

  int secondColon = line.indexOf(':', firstColon + 1);
  if (secondColon < 0) return false;

  int thirdColon = line.indexOf(':', secondColon + 1);
  if (thirdColon < 0) return false;

  SensorData data;
  data.sensorId = line.substring(0, firstColon);
  data.type     = line.substring(firstColon + 1, secondColon);
  data.unit     = line.substring(thirdColon + 1);

  // Parsear valor numérico
  String valueStr = line.substring(secondColon + 1, thirdColon);
  data.value = valueStr.toFloat();

  // Validación básica
  if (data.sensorId.length() == 0 || data.type.length() == 0) {
    return false;
  }

  readings.push_back(data);
  return true;
}

std::vector<SensorData> SerialParser::getReadings() {
  return readings;
}

void SerialParser::clearReadings() {
  readings.clear();
  frameReady = false;
}
