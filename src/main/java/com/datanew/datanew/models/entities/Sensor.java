package com.datanew.datanew.models.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "sensors", indexes = {
    @Index(name = "idx_sensor_station", columnList = "id_estacion"),
    @Index(name = "idx_sensor_username", columnList = "username")
})
public class Sensor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long sensor_id;

    @NotBlank(message = "Sensor name is required")
    @Size(max = 255, message = "Sensor name must not exceed 255 characters")
    @Column(name = "nombre_sensor")
    private String nombre_sensor;

    @NotBlank(message = "Station ID is required")
    @Column(name = "id_estacion")
    private String id_estacion;

    @Column(name = "id_sensor")
    private String id_sensor;

    @Column(name = "key_sensor")
    private String key_sensor;

    @Column(name = "canal")
    private Integer canal;

    @Column(name = "model_sensor")
    private String model_sensor;

    @NotBlank(message = "Sensor type is required")
    @Size(max = 100, message = "Sensor type must not exceed 100 characters")
    @Column(name = "tipo_sensor")
    private String tipo_sensor;

    @NotBlank(message = "Username is required")
    @Column(name = "username")
    private String username;

    public Long getSensor_id() {
        return sensor_id;
    }

    public void setSensor_id(Long sensor_id) {
        this.sensor_id = sensor_id;
    }

    public String getNombre_sensor() {
        return nombre_sensor;
    }

    public void setNombre_sensor(String nombre_sensor) {
        this.nombre_sensor = nombre_sensor;
    }

    public String getId_estacion() {
        return id_estacion;
    }

    public void setId_estacion(String id_estacion) {
        this.id_estacion = id_estacion;
    }

    public String getId_sensor() {
        return id_sensor;
    }

    public void setId_sensor(String id_sensor) {
        this.id_sensor = id_sensor;
    }

    public String getKey_sensor() {
        return key_sensor;
    }

    public void setKey_sensor(String key_sensor) {
        this.key_sensor = key_sensor;
    }

    public String getModel_sensor() {
        return model_sensor;
    }

    public void setModel_sensor(String model_sensor) {
        this.model_sensor = model_sensor;
    }

    public String getTipo_sensor() {
        return tipo_sensor;
    }

    public void setTipo_sensor(String tipo_sensor) {
        this.tipo_sensor = tipo_sensor;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public Integer getCanal() {
        return canal;
    }

    public void setCanal(Integer canal) {
        this.canal = canal;
    }
}