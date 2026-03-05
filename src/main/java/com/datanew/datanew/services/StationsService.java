package com.datanew.datanew.services;

import com.datanew.datanew.models.entities.Station;

import java.util.List;
import java.util.Optional;

public interface StationsService {

    List<Station> getAllStations();

    List<Station> getStationsByUser(String username);

    Optional<Station> findById(Long id);

    Station save(Station station);

    Optional<Station> update(Station station, Long id);

    void remove(Long id);
}
