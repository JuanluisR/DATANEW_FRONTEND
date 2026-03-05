package com.datanew.datanew.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.datanew.datanew.models.entities.Station;
import com.datanew.datanew.repositories.StationRepository;
import com.datanew.datanew.repositories.StationUserRepository;

@Service
public class StationServiceImpl implements StationsService {

    @Autowired
    private StationRepository repository;

    @Autowired
    private StationUserRepository stationUserRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Station> getAllStations() {
        return (List<Station>) repository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Station> getStationsByUser(String username) {
        return stationUserRepository.getstationsUser(username);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Station> findById(Long id) {
        return repository.findById(id);
    }

    @Override
    @Transactional
    public Station save(Station station) {
        return repository.save(station);
    }

    @Override
    @Transactional
    public void remove(Long id) {
        repository.deleteById(id);
    }

    @Override
    @Transactional
    public Optional<Station> update(Station station, Long id) {
        Optional<Station> o = findById(id);
        if (o.isPresent()) {
            Station stationDb = o.get();
            stationDb.setNombre_estacion(station.getNombre_estacion());
            stationDb.setLat(station.getLat());
            stationDb.setLon(station.getLon());
            stationDb.setForecast_key(station.getForecast_key());
            stationDb.setElevacion(station.getElevacion());
            stationDb.setAltura_suelo(station.getAltura_suelo());
            stationDb.setDepartamento(station.getDepartamento());
            stationDb.setCiudad(station.getCiudad());
            stationDb.setEstado(station.getEstado());
            stationDb.setPais(station.getPais());
            stationDb.setMarca(station.getMarca());
            stationDb.setModelo(station.getModelo());
            stationDb.setKey(station.getKey());
            stationDb.setPasskey(station.getPasskey());
            stationDb.setUsername(station.getUsername());
            stationDb.setWeatherlink_id(station.getWeatherlink_id());
            stationDb.setApi_key(station.getApi_key());
            stationDb.setApi_secret(station.getApi_secret());
            stationDb.setImei(station.getImei());
            stationDb.setFreq(station.getFreq());
            stationDb.setTipo_estacion(station.getTipo_estacion());
            return Optional.of(save(stationDb));
        }
        return Optional.empty();
    }
}
