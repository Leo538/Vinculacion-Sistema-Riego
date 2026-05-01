# 📡 API REST & WebSocket — Sensor Readings

Documentación completa de la capa de exposición de datos del backend: endpoints REST para consultas y WebSocket STOMP para streaming en tiempo real.

---

## 📋 Tabla de Contenidos

- [Arquitectura del Flujo de Datos](#-arquitectura-del-flujo-de-datos)
- [API REST](#-api-rest)
  - [Respuesta Estándar](#respuesta-estándar-apiresponse)
  - [Endpoints](#endpoints)
- [WebSocket (STOMP)](#-websocket-stomp)
  - [Conexión](#conexión)
  - [Topics](#topics-disponibles)
  - [Ejemplo de Integración Frontend](#ejemplo-de-integración-frontend)
- [Patrón REST + WebSocket](#-patrón-rest--websocket)
- [DTOs](#-dtos)
- [Estructura de Archivos](#-estructura-de-archivos)
- [Configuración](#-configuración)

---

## 🏗 Arquitectura del Flujo de Datos

```
ESP32 (MQTT Publish)
    │
    ▼
Mosquitto Broker (:1883)
    │
    ▼
SensorMqttHandler (callback)
    │
    ▼
SensorService.processMessage()
    │
    ├──► 1. MongoDB (saveAll)         ──► API REST (consultas bajo demanda)
    │
    └──► 2. SensorEventPublisher      ──► WebSocket STOMP (push en tiempo real)
              │
              ├── /topic/readings/live
              ├── /topic/devices/{deviceId}/readings
              └── /topic/devices/{deviceId}/sensors/{sensorId}
                        │
                        ▼
                  Dashboard Frontend
```

---

## 🔌 API REST

Base URL: `http://localhost:8080/api/v1`

### Respuesta Estándar (`ApiResponse`)

Todas las respuestas siguen esta estructura:

```json
{
  "success": true,
  "message": "OK",
  "data": { ... },
  "timestamp": "2026-04-30T12:00:00Z"
}
```

En caso de error:

```json
{
  "success": false,
  "message": "Parámetro requerido 'deviceId' no fue proporcionado",
  "data": null,
  "timestamp": "2026-04-30T12:00:00Z"
}
```

---

### Endpoints

#### 1. `GET /api/v1/readings` — Lecturas Paginadas

Obtiene todas las lecturas ordenadas por timestamp descendente.

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `page` | int | `0` | Número de página |
| `size` | int | `20` | Tamaño de página (máx: 100) |

**Ejemplo:**

```bash
curl "http://localhost:8080/api/v1/readings?page=0&size=10"
```

**Respuesta:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "content": [
      {
        "id": "663abc123...",
        "deviceId": "esp32_01",
        "sensorId": "TMP_INT",
        "type": "temperature",
        "value": 32.1,
        "unit": "°C",
        "timestamp": "2026-04-30T12:00:00Z"
      }
    ],
    "totalElements": 1520,
    "totalPages": 152,
    "number": 0,
    "size": 10
  },
  "timestamp": "2026-04-30T12:05:00Z"
}
```

**Uso en Dashboard:** Tabla de datos general con paginación.

---

#### 2. `GET /api/v1/readings/latest` — Última Lectura por Sensor

Obtiene la lectura más reciente de **cada sensor** para un dispositivo. Ideal para las cards de estado actual.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `deviceId` | String | ✅ | ID del dispositivo |

**Ejemplo:**

```bash
curl "http://localhost:8080/api/v1/readings/latest?deviceId=esp32_01"
```

**Respuesta:**

```json
{
  "success": true,
  "message": "Últimas lecturas del dispositivo esp32_01",
  "data": [
    {
      "id": "663abc123...",
      "deviceId": "esp32_01",
      "sensorId": "TMP_INT",
      "type": "temperature",
      "value": 32.1,
      "unit": "°C",
      "timestamp": "2026-04-30T12:00:00Z"
    },
    {
      "id": "663abc456...",
      "deviceId": "esp32_01",
      "sensorId": "HUM_INT",
      "type": "humidity",
      "value": 60.2,
      "unit": "%",
      "timestamp": "2026-04-30T12:00:00Z"
    }
  ],
  "timestamp": "2026-04-30T12:05:00Z"
}
```

**Uso en Dashboard:** Cards de estado actual (temperatura actual, humedad actual, etc.).

---

#### 3. `GET /api/v1/readings/history` — Histórico con Filtros

Obtiene lecturas históricas con filtros opcionales. Diseñado para gráficos de series de tiempo.

| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `deviceId` | String | ❌ | — | ID del dispositivo |
| `type` | String | ❌ | — | Tipo de sensor (`temperature`, `humidity`, etc.) |
| `sensorId` | String | ❌ | — | ID del sensor (`TMP_INT`, `HUM_INT`, etc.) |
| `from` | Instant (ISO-8601) | ❌ | 24h atrás | Inicio del rango de tiempo |
| `to` | Instant (ISO-8601) | ❌ | Ahora | Fin del rango de tiempo |
| `page` | int | ❌ | `0` | Número de página |
| `size` | int | ❌ | `50` | Tamaño de página (máx: 500) |

**Prioridad de filtros:** Si se envían múltiples filtros, la prioridad es:
1. `deviceId` + `sensorId` (más específico)
2. `deviceId` + `type`
3. `deviceId` solo
4. Solo rango de tiempo (sin filtros de dispositivo)

**Ejemplo:**

```bash
# Temperatura del sensor TMP_INT en las últimas 6 horas
curl "http://localhost:8080/api/v1/readings/history?deviceId=esp32_01&sensorId=TMP_INT&from=2026-04-30T06:00:00Z&to=2026-04-30T12:00:00Z&size=100"
```

**Respuesta:** Misma estructura paginada que `/readings`, pero ordenada por timestamp **ascendente** (ideal para gráficos).

**Uso en Dashboard:** Gráficos de líneas/áreas con series de tiempo.

---

#### 4. `GET /api/v1/readings/stats` — Estadísticas Agregadas

Calcula min, max, promedio y conteo por sensor usando **MongoDB Aggregation Pipeline**.

| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `deviceId` | String | ✅ | — | ID del dispositivo |
| `sensorId` | String | ❌ | — | ID del sensor (null = todos) |
| `from` | Instant (ISO-8601) | ❌ | 24h atrás | Inicio del rango |
| `to` | Instant (ISO-8601) | ❌ | Ahora | Fin del rango |

**Ejemplo:**

```bash
curl "http://localhost:8080/api/v1/readings/stats?deviceId=esp32_01&from=2026-04-30T00:00:00Z"
```

**Respuesta:**

```json
{
  "success": true,
  "message": "Estadísticas del dispositivo esp32_01",
  "data": [
    {
      "sensorId": "TMP_INT",
      "type": "temperature",
      "unit": "°C",
      "min": 18.5,
      "max": 35.2,
      "avg": 26.8,
      "count": 720
    },
    {
      "sensorId": "HUM_INT",
      "type": "humidity",
      "unit": "%",
      "min": 40.0,
      "max": 85.3,
      "avg": 62.1,
      "count": 720
    }
  ],
  "timestamp": "2026-04-30T12:05:00Z"
}
```

**Uso en Dashboard:** KPIs, resúmenes estadísticos, indicadores de rango.

**Nota técnica:** Este endpoint usa `MongoTemplate` con Aggregation Pipeline directamente, lo que es significativamente más eficiente que calcular en Java cuando hay grandes volúmenes de datos.

---

#### 5. `GET /api/v1/devices` — Dispositivos Registrados

Lista todos los device IDs únicos en el sistema.

**Ejemplo:**

```bash
curl "http://localhost:8080/api/v1/devices"
```

**Respuesta:**

```json
{
  "success": true,
  "message": "Se encontraron 3 dispositivos",
  "data": ["esp32_01", "esp32_02", "esp32_invernadero"],
  "timestamp": "2026-04-30T12:05:00Z"
}
```

**Uso en Dashboard:** Selector/dropdown de dispositivos.

---

#### 6. `GET /api/v1/devices/{deviceId}/sensors` — Sensores de un Dispositivo

Lista los sensores únicos registrados para un dispositivo (sensorId + type + unit).

**Ejemplo:**

```bash
curl "http://localhost:8080/api/v1/devices/esp32_01/sensors"
```

**Respuesta:**

```json
{
  "success": true,
  "message": "Sensores del dispositivo esp32_01",
  "data": [
    { "sensorId": "TMP_INT", "type": "temperature", "unit": "°C" },
    { "sensorId": "TMP_EXT", "type": "temperature", "unit": "°C" },
    { "sensorId": "HUM_INT", "type": "humidity", "unit": "%" },
    { "sensorId": "HUM_SUELO", "type": "soil_moisture", "unit": "%" }
  ],
  "timestamp": "2026-04-30T12:05:00Z"
}
```

**Uso en Dashboard:** Filtros dinámicos, selección de sensores para gráficos.

---

## 🔄 WebSocket (STOMP)

### Conexión

| Propiedad | Valor |
|-----------|-------|
| **Endpoint** | `ws://localhost:8080/ws` |
| **Protocolo** | STOMP sobre WebSocket |
| **SockJS Fallback** | `http://localhost:8080/ws` (con SockJS) |
| **CORS** | Todos los orígenes permitidos (desarrollo) |

### Topics Disponibles

#### `/topic/readings/live` — Feed Global

Recibe **todas** las lecturas nuevas de **todos** los dispositivos en tiempo real.

**Payload:** `SensorReadingEvent`

```json
{
  "deviceId": "esp32_01",
  "timestamp": "2026-04-30T12:00:00Z",
  "readings": [
    {
      "id": "663abc123...",
      "deviceId": "esp32_01",
      "sensorId": "TMP_INT",
      "type": "temperature",
      "value": 32.1,
      "unit": "°C",
      "timestamp": "2026-04-30T12:00:00Z"
    },
    {
      "id": "663abc456...",
      "deviceId": "esp32_01",
      "sensorId": "HUM_INT",
      "type": "humidity",
      "value": 60.2,
      "unit": "%",
      "timestamp": "2026-04-30T12:00:00Z"
    }
  ]
}
```

**Uso:** Vista general del dashboard que muestra todos los dispositivos.

---

#### `/topic/devices/{deviceId}/readings` — Feed por Dispositivo

Recibe las lecturas nuevas de un dispositivo específico.

**Payload:** Mismo `SensorReadingEvent` que el feed global, pero filtrado por device.

**Ejemplo de topic:** `/topic/devices/esp32_01/readings`

**Uso:** Dashboard dedicado a monitorear un solo dispositivo.

---

#### `/topic/devices/{deviceId}/sensors/{sensorId}` — Feed por Sensor

Recibe la lectura individual de un sensor específico.

**Payload:** `SensorReadingResponse` (lectura individual)

```json
{
  "id": "663abc123...",
  "deviceId": "esp32_01",
  "sensorId": "TMP_INT",
  "type": "temperature",
  "value": 32.1,
  "unit": "°C",
  "timestamp": "2026-04-30T12:00:00Z"
}
```

**Ejemplo de topic:** `/topic/devices/esp32_01/sensors/TMP_INT`

**Uso:** Widgets individuales como gauges, termómetros, indicadores de humedad.

---

### Ejemplo de Integración Frontend

#### Con SockJS + STOMP.js (recomendado para navegadores)

```html
<script src="https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/stompjs@2/lib/stomp.min.js"></script>
```

```javascript
const socket = new SockJS('http://localhost:8080/ws');
const stompClient = Stomp.over(socket);

// Opcional: desactivar logs de debug en producción
// stompClient.debug = null;

stompClient.connect({}, (frame) => {
    console.log('Conectado:', frame);

    // ── Feed global: todas las lecturas nuevas ──
    stompClient.subscribe('/topic/readings/live', (message) => {
        const event = JSON.parse(message.body);
        console.log(`Nuevo dato de ${event.deviceId}:`, event.readings);

        // Actualizar tabla, notificaciones, etc.
        event.readings.forEach(reading => {
            updateDashboardCard(reading.sensorId, reading.value, reading.unit);
        });
    });

    // ── Feed por dispositivo ──
    stompClient.subscribe('/topic/devices/esp32_01/readings', (message) => {
        const event = JSON.parse(message.body);
        // Actualizar vista del dispositivo
        refreshDeviceDashboard(event);
    });

    // ── Feed por sensor individual (para un gauge) ──
    stompClient.subscribe('/topic/devices/esp32_01/sensors/TMP_INT', (message) => {
        const reading = JSON.parse(message.body);
        // Actualizar gauge de temperatura
        updateGauge('temperature-gauge', reading.value);
    });

}, (error) => {
    console.error('Error de conexión WebSocket:', error);
    // Implementar reconexión automática
    setTimeout(() => connectWebSocket(), 5000);
});
```

#### Con WebSocket nativo (sin SockJS)

```javascript
const ws = new WebSocket('ws://localhost:8080/ws');

// STOMP CONNECT frame
ws.onopen = () => {
    ws.send('CONNECT\naccept-version:1.2\n\n\0');
};

ws.onmessage = (event) => {
    // Parsear frames STOMP manualmente o usar una librería STOMP ligera
    console.log('Mensaje recibido:', event.data);
};
```

---

## 🔀 Patrón REST + WebSocket

Los endpoints REST y los topics WebSocket se **complementan**, no se reemplazan:

```
┌─────────────────────────────────────────────────────────────┐
│                    DASHBOARD FRONTEND                        │
│                                                             │
│  1. Carga inicial ─────── GET /readings/latest ──► REST     │
│  2. Actualizaciones ────── /topic/.../readings ──► WebSocket│
│  3. Histórico ─────────── GET /readings/history ─► REST     │
│  4. Estadísticas ──────── GET /readings/stats ───► REST     │
│  5. Descubrimiento ────── GET /devices ──────────► REST     │
└─────────────────────────────────────────────────────────────┘
```

| Escenario | Canal | Justificación |
|-----------|-------|---------------|
| Usuario abre el dashboard | **REST** `/readings/latest` | Necesita el snapshot actual al cargar |
| Llegan datos nuevos del ESP32 | **WebSocket** `/topic/...` | Push instantáneo sin polling |
| Usuario consulta historial | **REST** `/readings/history` | Consulta bajo demanda con filtros y paginación |
| Usuario ve resumen estadístico | **REST** `/readings/stats` | Cálculo pesado con MongoDB Aggregation |
| Usuario cambia de dispositivo | **REST** `/devices` + `/sensors` | Datos que cambian poco, no necesitan real-time |

---

## 📦 DTOs

### `ApiResponse<T>` — Wrapper de respuesta REST

```java
public record ApiResponse<T>(
    boolean success,     // true si la operación fue exitosa
    String message,      // Mensaje descriptivo
    T data,              // Payload de datos (genérico)
    Instant timestamp    // Timestamp de la respuesta
)
```

### `SensorReadingResponse` — Lectura individual

```java
public record SensorReadingResponse(
    String id,           // ID de MongoDB
    String deviceId,     // "esp32_01"
    String sensorId,     // "TMP_INT"
    String type,         // "temperature"
    Double value,        // 32.1
    String unit,         // "°C"
    Instant timestamp    // "2026-04-30T12:00:00Z"
)
```

### `SensorStatsResponse` — Estadísticas agregadas

```java
public record SensorStatsResponse(
    String sensorId,     // "TMP_INT"
    String type,         // "temperature"
    String unit,         // "°C"
    Double min,          // 18.5
    Double max,          // 35.2
    Double avg,          // 26.8
    Long count           // 720
)
```

### `SensorInfoResponse` — Info de un sensor

```java
public record SensorInfoResponse(
    String sensorId,     // "TMP_INT"
    String type,         // "temperature"
    String unit          // "°C"
)
```

### `SensorReadingEvent` — Evento WebSocket

```java
public record SensorReadingEvent(
    String deviceId,                        // "esp32_01"
    Instant timestamp,                      // Timestamp del evento
    List<SensorReadingResponse> readings    // Lecturas del mensaje
)
```

---

## 📁 Estructura de Archivos

```
backend/src/main/java/com/uta/iot_backend/
├── config/
│   ├── MqttConfig.java                  # (existente) Conexión MQTT
│   ├── SensorMqttHandler.java           # (existente) Callback MQTT
│   ├── JacksonConfig.java               # (existente) Serialización Instant
│   ├── WebConfig.java                   # ✨ CORS para API REST
│   ├── WebSocketConfig.java             # ✨ STOMP WebSocket config
│   └── GlobalExceptionHandler.java      # ✨ Manejo global de errores
│
└── sensor/
    ├── model/
    │   ├── SensorMqttMessage.java       # (existente) DTO MQTT
    │   └── SensorReading.java           # (existente) Entidad MongoDB
    ├── dto/
    │   ├── ApiResponse.java             # ✨ Wrapper genérico de respuesta
    │   ├── SensorReadingResponse.java   # ✨ DTO de lectura
    │   ├── SensorStatsResponse.java     # ✨ DTO de estadísticas
    │   ├── SensorInfoResponse.java      # ✨ DTO de info de sensor
    │   └── SensorReadingEvent.java      # ✨ DTO de evento WebSocket
    ├── repository/
    │   └── SensorRepository.java        # 📝 Queries adicionales
    ├── service/
    │   ├── SensorService.java           # 📝 Métodos de consulta + broadcast
    │   └── SensorEventPublisher.java    # ✨ Publisher WebSocket
    └── controllers/
        └── SensorReadingController.java # ✨ REST Controller
```

> ✨ = Archivo nuevo | 📝 = Archivo modificado

---

## ⚙ Configuración

### Dependencia Añadida (`pom.xml`)

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
```

### CORS

Configurado en `WebConfig.java` para rutas `/api/**`:
- **Orígenes:** Todos (`*`) — restringir en producción
- **Métodos:** GET, POST, PUT, DELETE, OPTIONS
- **Credenciales:** Habilitadas
- **Max Age:** 3600s

### WebSocket

Configurado en `WebSocketConfig.java`:
- **Endpoint de conexión:** `/ws`
- **Prefijo de broker:** `/topic`
- **Prefijo de app:** `/app` (para futuros mensajes client→server)
- **SockJS:** Habilitado como fallback
- **CORS WebSocket:** Todos los orígenes (`*`)

### Manejo de Errores

`GlobalExceptionHandler.java` captura:
- `MissingServletRequestParameterException` → 400 Bad Request
- `MethodArgumentTypeMismatchException` → 400 Bad Request (formato inválido)
- `Exception` genérica → 500 Internal Server Error

Todos los errores responden con el formato `ApiResponse` estándar.
