# IoT Weather Dashboard

Monorepo: dashboard **Next.js**, backend **Spring Boot** (MQTT, MongoDB, WebSocket/STOMP), broker **Mosquitto**, firmware **ESP32** (`esp32_iot/`).

---

## Cómo iniciar el proyecto

### Opción recomendada: Docker Compose (stack completo)

Desde la raíz del repositorio:

```bash
docker compose up --build
```

Eso levanta:

| Servicio       | Puerto | Descripción                          |
|----------------|--------|--------------------------------------|
| Backend API    | 8080   | REST, Swagger UI, WebSocket (`/ws`)  |
| Mosquitto      | 1883   | MQTT                                 |
| Mosquitto WS   | 9001   | WebSocket MQTT (opcional)            |
| MongoDB        | 27017  | Base de datos                        |
| Mongo Express  | 8081   | UI web de Mongo (solo desarrollo)    |

- API REST y documentación OpenAPI: `http://localhost:8080/swagger-ui.html` (o la ruta que exponga Springdoc en tu versión).
- Detalle de endpoints y WebSocket: [`backend/API_REST_WEBSOCKET.md`](backend/API_REST_WEBSOCKET.md).

Variables ya definidas en `docker-compose.yml`: `MQTT_BROKER_URL`, `SPRING_MONGODB_URI` para el contenedor del backend.

---

### Frontend en desarrollo (local)

Con el backend (y Mongo + Mosquitto) ya accesibles según tu escenario:

```bash
cd frontend
npm install
npm run dev
```

Por defecto Next.js sirve en **http://localhost:3000**.

---

### Backend sin Docker (solo si lo necesitas)

1. **Java 21** (`java -version` debe mostrar 21). El proyecto no compila con versiones anteriores.
2. MongoDB y Mosquitto corriendo (puedes levantar solo esos servicios con Docker o instalarlos en el sistema).
3. Ajusta `backend/src/main/resources/application.properties` (URI de Mongo, `mqtt.broker.url`, etc.).
4. En la carpeta `backend`:

```bash
./mvnw.cmd package   # Windows
# ./mvnw package     # Linux / macOS
java -jar target/*SNAPSHOT.jar
```

---

## Git: `.gitignore` y `.gitattributes` (no están duplicados)

- **`.gitignore`**: indica qué archivos y carpetas **no** deben versionarse (por ejemplo `backend/target/`, datos de Mosquitto, `.env`, artefactos de IDE).
- **`.gitattributes`**: no ignora nada; define **cómo** Git trata los archivos (fines de línea LF/CRLF, archivos binarios como `.jar`).

Conviven sin solaparse: uno filtra qué entra al repo; el otro normaliza el formato de lo que sí se versiona.

---

## Estructura rápida

| Ruta        | Contenido                          |
|-------------|------------------------------------|
| `frontend/` | Aplicación Next.js                 |
| `backend/`  | API Spring Boot                    |
| `esp32_iot/`| Firmware ESP32                     |
| `mosquitto/`| Configuración del broker           |
| `mongo-init/`| Scripts de inicialización Mongo   |
