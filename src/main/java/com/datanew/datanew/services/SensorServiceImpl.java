package com.datanew.datanew.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.datanew.datanew.models.entities.Sensor;
import com.datanew.datanew.repositories.SensorRepository;

@Service
public class SensorServiceImpl implements SensorService {
    
    @Autowired
    private SensorRepository repository;

    @Override
@Transactional(readOnly = true)
    public List<Sensor> findAll() {
        return (List<Sensor>) repository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Sensor> findByIdEstacion(String idEstacion) {
        return repository.findByIdEstacion(idEstacion);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Sensor> findById(Long sensor_id) {
       return repository.findById(sensor_id);
    }

    @Override
    @Transactional
    public Sensor save(Sensor sensor) {
       return repository.save(sensor);
    }

    @Override
    @Transactional
    public Optional<Sensor> update(Sensor sensor, Long sensor_id) {
        Optional<Sensor> o = findById(sensor_id);
        if (o.isPresent()) {
            Sensor sensorDb = o.orElseThrow();
            sensorDb.setNombre_sensor(sensor.getNombre_sensor());
            sensorDb.setId_estacion(sensor.getId_estacion());
            sensorDb.setId_sensor(sensor.getId_sensor());
            sensorDb.setKey_sensor(sensor.getKey_sensor());
            sensorDb.setModel_sensor(sensor.getModel_sensor());
            sensorDb.setTipo_sensor(sensor.getTipo_sensor());
            sensorDb.setUsername(sensor.getUsername());
            return Optional.of(save(sensorDb));
        }
        return Optional.empty();
    }

    @Override
    @Transactional
    public void remove(Long sensor_id) {
        repository.deleteById(sensor_id);
    }
    

}