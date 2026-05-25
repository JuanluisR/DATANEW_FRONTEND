package com.datanew.datanew.services;

import com.datanew.datanew.models.entities.Cultivo;

import java.util.List;
import java.util.Optional;

public interface CultivoService {

    List<Cultivo> getAllCultivos();

    List<Cultivo> getCultivosByUsername(String username);

    List<Cultivo> getActiveCultivosByUsername(String username);

    List<Cultivo> getCultivosByStation(String idEstacion);

    Optional<Cultivo> getCultivoById(Long id);

    Cultivo createCultivo(Cultivo cultivo);

    Optional<Cultivo> updateCultivo(Long id, Cultivo cultivoDetails);

    void deleteCultivo(Long id);

    boolean existsById(Long id);

    Optional<Cultivo> toggleCultivoActive(Long id);
}
