package com.uta.iot_backend.sensor.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Builder;
import lombok.Data;

@Document(collection = "sensor_readings")
@Data
@Builder
public class SensorReading {

    @Id
    private String id;

    private String deviceId;      
    private String sensorId;       
    private String type;           
    private Double value;          
    private String unit;           
    private Instant timestamp;    
}