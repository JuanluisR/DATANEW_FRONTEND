package com.datanew.datanew.services;

import java.util.List;
import java.util.Optional;

import com.datanew.datanew.dto.ClimateStatsDTO;
import com.datanew.datanew.models.entities.DataStation;

public interface DataStationService {

    List<DataStation> findAll();

    Optional<DataStation> findById(Long data_id);

    Optional<DataStation> findLatestByIdEstacion(String idEstacion);

    Optional<ClimateStatsDTO> getClimateStats(String idEstacion);

    List<DataStation> findByDateRange(String idEstacion, java.time.LocalDateTime startDate, java.time.LocalDateTime endDate);
    
    List<DataStation> findByDateRangeString(String idEstacion, String startDate, String endDate);

    DataStation save(DataStation dataStation);

    Optional<DataStation> update(DataStation dataStation, Long data_id);

    void remove(Long data_id);
    
    boolean validateApiKeyForStation(String apiKey, String idEstacion);
}