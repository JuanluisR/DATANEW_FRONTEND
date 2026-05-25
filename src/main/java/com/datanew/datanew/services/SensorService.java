package com.datanew.datanew.services;

import java.util.List;
import java.util.Optional;

import com.datanew.datanew.models.entities.Sensor;


public interface SensorService {

    List<Sensor> findAll();

    List<Sensor> findByIdEstacion(String idEstacion);

    Optional<Sensor> findById(Long sensor_id);

    Sensor save(Sensor sensor);
    Optional<Sensor> update(Sensor sensor, Long sensor_id);

    void remove(Long sensor_id);

    boolean existsDuplicate(String idSensor, Integer canal, String tipoSensor, String username, Long excludeId);
}