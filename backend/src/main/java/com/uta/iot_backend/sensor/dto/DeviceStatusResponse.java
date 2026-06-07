package com.uta.iot_backend.sensor.dto;

import com.fasterxml.jackson.databind.JsonNode;

public record DeviceStatusResponse(
    WiFiStatus wifi,
    MqttStatus mqtt,
    DeviceInfo device
) {
    public record WiFiStatus(
        boolean connected,
        String ip,
        String ssid
    ) {}

    public record MqttStatus(
        boolean connected,
        String host,
        int port,
        String topic
    ) {}

    public record DeviceInfo(
        String id,
        boolean ap_mode,
        long uptime_ms
    ) {}

    public static DeviceStatusResponse fromJsonNode(JsonNode json) {
        JsonNode wifiNode = json.get("wifi");
        WiFiStatus wifi = new WiFiStatus(
            wifiNode.get("connected").asBoolean(),
            wifiNode.get("ip").asText(),
            wifiNode.get("ssid").asText()
        );

        JsonNode mqttNode = json.get("mqtt");
        MqttStatus mqtt = new MqttStatus(
            mqttNode.get("connected").asBoolean(),
            mqttNode.get("host").asText(),
            mqttNode.get("port").asInt(),
            mqttNode.get("topic").asText()
        );

        JsonNode deviceNode = json.get("device");
        DeviceInfo device = new DeviceInfo(
            deviceNode.get("id").asText(),
            deviceNode.get("ap_mode").asBoolean(),
            deviceNode.get("uptime_ms").asLong()
        );

        return new DeviceStatusResponse(wifi, mqtt, device);
    }
}
