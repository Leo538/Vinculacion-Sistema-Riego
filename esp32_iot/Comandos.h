#ifndef COMANDOS_H
#define COMANDOS_H

#include <Arduino.h>

// Comandos de configuración para la propia ESP32 (gateway). Llegan por MQTT
// en esp/comando/{deviceId}/gateway y se ejecutan localmente; nunca se
// reenvían al Arduino Mega (eso es el destino .../riego, ver esp32_iot.ino).
//
// Este enum vive en un header -y no directamente en el .ino- porque el IDE
// de Arduino autogenera prototipos de función y los inserta justo después
// del último #include, antes de cualquier tipo declarado más abajo en el
// .ino. Si ComandoGateway estuviera en el .ino, el prototipo autogenerado
// de parseComandoGateway() quedaría antes de la definición del enum y el
// compilador fallaría con "ComandoGateway does not name a type".
enum class ComandoGateway : uint8_t {
  NINGUNO = 0,   // no hay comando pendiente de ejecutar
  DESCONOCIDO,   // payload recibido pero no coincide con ningún comando
  RESET,
  AP,
  STATUS
};

#endif
