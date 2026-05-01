#ifndef SERIAL_PARSER_H
#define SERIAL_PARSER_H

#include <Arduino.h>
#include <vector>

struct SensorData {
  String sensorId;
  String type;
  float  value;
  String unit;
};

class SerialParser {
public:
  // Lee Serial1 y retorna true cuando se recibió una trama completa (END)
  bool readSerial(HardwareSerial& serial);

  // Obtener las lecturas parseadas
  std::vector<SensorData> getReadings();

  // Limpiar después de procesar
  void clearReadings();

private:
  String lineBuffer = "";
  std::vector<SensorData> readings;
  bool frameReady = false;

  bool parseLine(const String& line);
};

#endif
