package com.datanew.datanew.dto.response;

import com.datanew.datanew.models.entities.Sensor;

public class SensorResponseDTO {

    private Long sensor_id;
    private String nombre_sensor;
    private String id_estacion;
    private String id_sensor;
    private String model_sensor;
    private String tipo_sensor;
    private String username;
    private Integer canal;

    public static SensorResponseDTO fromEntity(Sensor sensor) {
        SensorResponseDTO dto = new SensorResponseDTO();
        dto.sensor_id = sensor.getSensor_id();
        dto.nombre_sensor = sensor.getNombre_sensor();
        dto.id_estacion = sensor.getId_estacion();
        dto.id_sensor = sensor.getId_sensor();
        dto.model_sensor = sensor.getModel_sensor();
        dto.tipo_sensor = sensor.getTipo_sensor();
        dto.username = sensor.getUsername();
        dto.canal = sensor.getCanal();
        return dto;
    }

    public Long getSensor_id() { return sensor_id; }
    public String getNombre_sensor() { return nombre_sensor; }
    public String getId_estacion() { return id_estacion; }
    public String getId_sensor() { return id_sensor; }
    public String getModel_sensor() { return model_sensor; }
    public String getTipo_sensor() { return tipo_sensor; }
    public String getUsername() { return username; }
    public Integer getCanal() { return canal; }
}
