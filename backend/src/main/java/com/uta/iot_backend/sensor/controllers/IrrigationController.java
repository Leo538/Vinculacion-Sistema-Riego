package com.uta.iot_backend.sensor.controllers;

import com.uta.iot_backend.sensor.dto.ApiResponse;
import com.uta.iot_backend.sensor.dto.ComandoGatewayRequest;
import com.uta.iot_backend.sensor.dto.ComandoRiegoRequest;
import com.uta.iot_backend.sensor.dto.DeviceStatusResponse;
import com.uta.iot_backend.sensor.dto.IrrigationStateResponse;
import com.uta.iot_backend.sensor.service.IrrigationService;
import com.uta.iot_backend.sensor.service.IrrigationStateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class IrrigationController {

    private final IrrigationService irrigationService;
    private final IrrigationStateService irrigationStateService;

    @PostMapping("/devices/{deviceId}/riego/comando")
    @Operation(
            summary = "Enviar comando al sistema de riego",
            description = "Publica en esp/comando/{deviceId}/riego. La ESP32 traduce el nombre "
                    + "del comando al carácter único que entiende el firmware legacy del Arduino "
                    + "Mega ('E'/'A'/'M'/'U' por Serial1) y lo ejecuta: encender/apagar el riego, "
                    + "o cambiar entre modo manual y automático.",
            tags = {"Irrigation"}
    )
    public ResponseEntity<ApiResponse<String>> sendRiegoCommand(
            @Parameter(description = "ID del dispositivo", example = "esp32_01")
            @PathVariable String deviceId,
            @RequestBody ComandoRiegoRequest request) {

        irrigationService.sendRiegoCommand(deviceId, request.comando());
        return ResponseEntity.ok(ApiResponse.ok(
                request.comando().name(),
                "Comando de riego enviado al dispositivo " + deviceId
        ));
    }

    @PostMapping("/devices/{deviceId}/gateway/comando")
    @Operation(
            summary = "Enviar comando de configuración al gateway ESP32",
            description = "Publica en esp/comando/{deviceId}/gateway. La ESP32 ejecuta el comando "
                    + "sobre sí misma (resetear configuración, entrar en modo AP, reportar estado) "
                    + "en lugar de reenviarlo al Arduino Mega.",
            tags = {"Irrigation"}
    )
    public ResponseEntity<ApiResponse<String>> sendGatewayCommand(
            @Parameter(description = "ID del dispositivo", example = "esp32_01")
            @PathVariable String deviceId,
            @RequestBody ComandoGatewayRequest request) {

        irrigationService.sendGatewayCommand(deviceId, request.comando());
        return ResponseEntity.ok(ApiResponse.ok(
                request.comando().name(),
                "Comando de configuración enviado al dispositivo " + deviceId
        ));
    }

    @GetMapping("/devices/{deviceId}/status")
    @Operation(
            summary = "Obtener estado del dispositivo",
            description = "Solicita el estado actual del dispositivo ESP32 por MQTT. "
                    + "Publica en esp/comando/{deviceId}/gateway con comando STATUS, "
                    + "espera la respuesta en esp/respuesta/{deviceId} y devuelve los datos JSON.",
            tags = {"Device Management"}
    )
    public ResponseEntity<ApiResponse<DeviceStatusResponse>> getDeviceStatus(
            @Parameter(description = "ID del dispositivo", example = "esp32_01")
            @PathVariable String deviceId) {

        DeviceStatusResponse status = irrigationService.getDeviceStatus(deviceId);
        return ResponseEntity.ok(ApiResponse.ok(
                status,
                "Estado del dispositivo obtenido exitosamente"
        ));
    }

    @GetMapping("/devices/{deviceId}/riego/estado")
    @Operation(
            summary = "Obtener estado del sistema de riego (Mega)",
            description = "Devuelve el último estado conocido del sistema de riego controlado por el "
                    + "Arduino Mega (encendido/apagado, modo automático/manual, último comando recibido). "
                    + "Se calcula a partir de los sensores 'estado_sistema', 'modo_riego' y 'ultimo_comando' "
                    + "que la Mega agrega a su paquete periódico (ver mega.txt) y que llegan por el flujo "
                    + "normal de lecturas MQTT; también se publican en vivo por WebSocket en "
                    + "/topic/devices/{deviceId}/riego/estado.",
            tags = {"Irrigation"}
    )
    public ResponseEntity<ApiResponse<IrrigationStateResponse>> getIrrigationState(
            @Parameter(description = "ID del dispositivo", example = "esp32_01")
            @PathVariable String deviceId) {

        return irrigationStateService.getState(deviceId)
                .map(state -> ResponseEntity.ok(ApiResponse.ok(state, "Estado del sistema de riego obtenido exitosamente")))
                .orElseGet(() -> ResponseEntity.ok(ApiResponse.error(
                        "Aún no se ha recibido el estado del sistema de riego para " + deviceId)));
    }

    @PostMapping("/devices/{deviceId}/reset")
    @Operation(
            summary = "Reiniciar dispositivo en modo AP",
            description = "Ordena al dispositivo ESP32 que borre su configuración y reinicie en modo AP. "
                    + "Publica en esp/comando/{deviceId}/gateway con comando RESET.",
            tags = {"Device Management"}
    )
    public ResponseEntity<ApiResponse<String>> resetDevice(
            @Parameter(description = "ID del dispositivo", example = "esp32_01")
            @PathVariable String deviceId) {

        irrigationService.resetDeviceToAP(deviceId);
        return ResponseEntity.ok(ApiResponse.ok(
                "reset_initiated",
                "Dispositivo " + deviceId + " iniciando reset"
        ));
    }

    @PostMapping("/devices/{deviceId}/ap")
    @Operation(
            summary = "Entrar en modo Access Point",
            description = "Ordena al dispositivo ESP32 que entre en modo AP (punto de acceso). "
                    + "Publica en esp/comando/{deviceId}/gateway con comando AP.",
            tags = {"Device Management"}
    )
    public ResponseEntity<ApiResponse<String>> enterAPMode(
            @Parameter(description = "ID del dispositivo", example = "esp32_01")
            @PathVariable String deviceId) {

        irrigationService.enterAPMode(deviceId);
        return ResponseEntity.ok(ApiResponse.ok(
                "ap_mode_initiated",
                "Dispositivo " + deviceId + " entrando en modo AP"
        ));
    }
}
