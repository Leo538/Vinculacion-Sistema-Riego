package com.uta.iot_backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Configuración de WebSocket con STOMP para streaming en tiempo real.
 *
 * <h3>Endpoint de conexión:</h3>
 * <pre>ws://   :8080/ws</pre>
 *
 * <h3>Topics disponibles para suscripción:</h3>
 * <ul>
 *   <li>{@code /topic/readings/live} — Todas las lecturas nuevas (global)</li>
 *   <li>{@code /topic/devices/{deviceId}/readings} — Lecturas de un dispositivo específico</li>
 *   <li>{@code /topic/devices/{deviceId}/sensors/{sensorId}} — Lecturas de un sensor específico</li>
 * </ul>
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Prefijo para topics a los que el cliente se suscribe
        registry.enableSimpleBroker("/topic");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Endpoint principal de conexión WebSocket
        // withSockJS() habilita fallback para navegadores que no soporten WebSocket nativo
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();

        // Endpoint sin SockJS para clientes WebSocket nativos
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");
    }
}
