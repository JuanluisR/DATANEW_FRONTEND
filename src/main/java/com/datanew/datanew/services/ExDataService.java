package com.datanew.datanew.services;

import java.util.List;
import java.util.Optional;

import com.datanew.datanew.models.entities.ExData;

public interface ExDataService {

    List<ExData> findBySensor(String idSensor);

    Optional<ExData> findLatestBySensor(String idSensor);

    List<ExData> findByEstacion(String idEstacion);

    ExData save(ExData exData);

    void delete(Long id);
}
