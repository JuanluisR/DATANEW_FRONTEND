package com.datanew.datanew.services;

import java.util.List;
import java.util.Optional;

import com.datanew.datanew.models.entities.Station;

public interface StationsService {
    

    List<Station> getAllStations();
    List<Station> getStationsByUser(String username);

    Optional<Station> findById(Long id);

    

    Station save(Station station);
    Optional<Station> update(Station station, Long id);

    void remove(Long id);

    List<?> getWeatherlinkDevices(String apiKey, String apiSecret);
    List<?> getWeatherlinkCurrentData(Long stationId);
    java.util.Map<String, Object> geocode(double lat, double lon);


}
