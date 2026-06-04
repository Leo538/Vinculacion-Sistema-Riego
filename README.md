# Proyecto de vinculación — Sistema de riego inteligente (IoT)

Dashboard y API para monitorear sensores agrícolas, clima de referencia (Open-Meteo) y recomendaciones de riego. Incluye frontend **Next.js**, backend **Spring Boot** (MQTT, MongoDB, WebSocket), broker **Mosquitto** y firmware de ejemplo **ESP32** (`esp32_iot/`).

---

## Frontend (desarrollo)

Desde la carpeta `frontend`:

```bash
cd frontend
npm install
npm run dev
```

La app queda en **http://localhost:3000** (por defecto).

Configura la URL del backend, por ejemplo en `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Con el API y la base de datos levantados para que existan dispositivos y lecturas.

---

## Stack completo con Docker

Desde la raíz del proyecto:

```bash
docker compose up --build
```

| Servicio       | Puerto | Descripción                          |
|----------------|--------|--------------------------------------|
| Frontend       | 3000   | Dashboard Next.js                    |
| Backend API    | 8080   | REST, Swagger, WebSocket (`/ws`)     |
| Mosquitto      | 1883   | MQTT                                 |
| Mosquitto WS   | 9001   | WebSocket MQTT (opcional)            |
| MongoDB        | 27017  | Base de datos                        |
| Mongo Express  | 8081   | UI web de Mongo (desarrollo)         |

- Swagger: `http://localhost:8080/swagger-ui.html` (o la ruta que use Springdoc en tu versión).
- Más detalle: [`backend/API_REST_WEBSOCKET.md`](backend/API_REST_WEBSOCKET.md).

---

## Backend sin Docker (opcional)

1. **Java 21** (`java -version`).
2. MongoDB y Mosquitto en ejecución (o solo esos servicios vía Docker).
3. Ajusta `backend/src/main/resources/application.properties` (Mongo, `mqtt.broker.url`, etc.).
4. En `backend`:

```bash
./mvnw.cmd package   # Windows
# ./mvnw package     # Linux / macOS
java -jar target/*SNAPSHOT.jar
```

---

## Estructura del repositorio

| Ruta | Rol |
|------|-----|
| `frontend/` | Dashboard Next.js (sensores, clima, alertas, riego, Open-Meteo). |
| `backend/` | API Spring Boot: lecturas MQTT → Mongo, REST `/api/v1/...`, WebSocket. |
| `esp32_iot/` | Sketch de ejemplo para publicar lecturas por MQTT. |
| `mosquitto/` | Configuración y logs del broker MQTT. |
| `mongo-init/` | Scripts de inicialización / seed de MongoDB. |

### Estructura de carpetas (resumen)

```
iot-weather-dashboard/
├── docker-compose.yml          # Mongo, Mosquitto, backend, mongo-express
├── README.md
│
├── frontend/                   # Next.js 14 (App Router)
│   ├── package.json
│   └── src/
│       ├── app/                # Rutas: /, /dashboard, /sensores, /riego, /alertas
│       ├── lib/api/            # Cliente HTTP (devices, readings, tipos)
│       ├── modules/
│       │   ├── alertas/
│       │   ├── dashboard/      # Vistas Open-Meteo, IoT, alertas derivadas
│       │   ├── riego/
│       │   └── sensores/
│       └── shared/             # Layout, UI, tema, utilidades compartidas
│
├── backend/                    # Spring Boot
│   ├── Dockerfile
│   ├── pom.xml
│   ├── API_REST_WEBSOCKET.md
│   └── src/
│       ├── main/java/com/uta/iot_backend/
│       │   ├── config/         # MQTT, Web, CORS, etc.
│       │   └── sensor/         # controladores REST, modelo, repos, MQTT
│       ├── main/resources/     # application.properties
│       └── test/
│
├── esp32_iot/                  # Firmware ESP32 (.ino + módulos C++)
├── mongo-init/
│   └── *.js                     # Seeds / init Mongo
└── mosquitto/
    ├── config/mosquitto.conf
    ├── data/
    └── log/
```

(No se listan `node_modules`, `target/`, `.next` ni otros generados; suelen estar en `.gitignore`.)
