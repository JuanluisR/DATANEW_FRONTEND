package com.datanew.datanew.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.datanew.datanew.models.entities.ExData;
import com.datanew.datanew.repositories.ExDataRepository;

@Service
public class ExDataServiceImpl implements ExDataService {

    @Autowired
    private ExDataRepository repository;

    @Override
    public List<ExData> findBySensor(String idSensor) {
        return repository.findByIdSensorOrderByReportDateDesc(idSensor);
    }

    @Override
    public Optional<ExData> findLatestBySensor(String idSensor) {
        return repository.findLatestByIdSensor(idSensor);
    }

    @Override
    public List<ExData> findByEstacion(String idEstacion) {
        return repository.findByIdEstacionOrderByReportDateDesc(idEstacion);
    }

    @Override
    public ExData save(ExData exData) {
        return repository.save(exData);
    }

    @Override
    public void delete(Long id) {
        repository.deleteById(id);
    }
}
