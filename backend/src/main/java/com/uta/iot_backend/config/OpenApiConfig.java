package com.uta.iot_backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        OpenAPI openAPI = new OpenAPI()
                .info(new Info()
                        .title("IoT Backend API")
                        .version("1.0.0")
                        .description("Endpoints REST para lecturas de sensores y consulta de dispositivos."))
                .addServersItem(new Server().url("http://localhost:8080"));

        Tag websocketTag = new Tag()
            .name("WebSocket")
            .description(
                "STOMP over WebSocket (informativo).\n" +
                "Endpoint: ws://localhost:8080/ws\n" +
                "Topics:\n" +
                "- /topic/readings/live (SensorReadingEvent)\n" +
                "- /topic/devices/{deviceId}/readings (SensorReadingEvent)\n" +
                "- /topic/devices/{deviceId}/sensors/{sensorId} (SensorReadingResponse)"
            );
        openAPI.addTagsItem(websocketTag);

        Map<String, Object> websocket = new LinkedHashMap<>();
        websocket.put("url", "ws://localhost:8080/ws");
        websocket.put("protocol", "stomp");

        List<Map<String, String>> topics = new ArrayList<>();
        topics.add(Map.of("name", "/topic/readings/live", "payload", "SensorReadingEvent"));
        topics.add(Map.of("name", "/topic/devices/{deviceId}/readings", "payload", "SensorReadingEvent"));
        topics.add(Map.of("name", "/topic/devices/{deviceId}/sensors/{sensorId}", "payload", "SensorReadingResponse"));
        websocket.put("topics", topics);

        openAPI.addExtension("x-websocket", websocket);
        return openAPI;
    }
}
