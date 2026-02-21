package com.datanew.datanew.services;

import com.datanew.datanew.models.entities.Cultivo;
import com.datanew.datanew.repositories.CultivoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class CultivoService {

    @Autowired
    private CultivoRepository cultivoRepository;

    @Autowired
    private BalanceHidricoService balanceHidricoService;

    public List<Cultivo> getAllCultivos() {
        return cultivoRepository.findAll();
    }

    public List<Cultivo> getCultivosByUsername(String username) {
        return cultivoRepository.findByUsernameOrderByFechaCreacionDesc(username);
    }

    public List<Cultivo> getActiveCultivosByUsername(String username) {
        return cultivoRepository.findByUsernameAndIsActiveTrue(username);
    }

    public List<Cultivo> getCultivosByStation(String idEstacion) {
        return cultivoRepository.findByIdEstacion(idEstacion);
    }

    public Optional<Cultivo> getCultivoById(Long id) {
        return cultivoRepository.findById(id);
    }

    public Cultivo createCultivo(Cultivo cultivo) {
        // Calcular días desde siembra
        if (cultivo.getFechaSiembra() != null) {
            int dias = (int) ChronoUnit.DAYS.between(cultivo.getFechaSiembra(), LocalDate.now());
            cultivo.setDiasDesdeSiembra(dias);

            // Calcular etapa actual
            String etapa = balanceHidricoService.calcularEtapaActual(cultivo.getTipoCultivo(), dias);
            cultivo.setEtapaActual(etapa);

            // Obtener Kc actual
            Double kc = balanceHidricoService.getKc(cultivo.getTipoCultivo(), etapa);
            cultivo.setKcActual(kc);
        }

        return cultivoRepository.save(cultivo);
    }

    public Optional<Cultivo> updateCultivo(Long id, Cultivo cultivoDetails) {
        return cultivoRepository.findById(id).map(cultivo -> {
            cultivo.setNombreCultivo(cultivoDetails.getNombreCultivo());
            cultivo.setTipoCultivo(cultivoDetails.getTipoCultivo());
            cultivo.setIdEstacion(cultivoDetails.getIdEstacion());
            cultivo.setNombreEstacion(cultivoDetails.getNombreEstacion());
            cultivo.setFechaSiembra(cultivoDetails.getFechaSiembra());
            cultivo.setFechaCosechaEstimada(cultivoDetails.getFechaCosechaEstimada());
            cultivo.setAreaHectareas(cultivoDetails.getAreaHectareas());
            cultivo.setTipoSuelo(cultivoDetails.getTipoSuelo());
            cultivo.setCapacidadCampo(cultivoDetails.getCapacidadCampo());
            cultivo.setPuntoMarchitez(cultivoDetails.getPuntoMarchitez());
            cultivo.setProfundidadRaices(cultivoDetails.getProfundidadRaices());
            cultivo.setIsActive(cultivoDetails.getIsActive());
            cultivo.setNotas(cultivoDetails.getNotas());

            // Recalcular días desde siembra
            if (cultivo.getFechaSiembra() != null) {
                int dias = (int) ChronoUnit.DAYS.between(cultivo.getFechaSiembra(), LocalDate.now());
                cultivo.setDiasDesdeSiembra(dias);

                // Recalcular etapa actual
                String etapa = balanceHidricoService.calcularEtapaActual(cultivo.getTipoCultivo(), dias);
                cultivo.setEtapaActual(etapa);

                // Obtener Kc actual
                Double kc = balanceHidricoService.getKc(cultivo.getTipoCultivo(), etapa);
                cultivo.setKcActual(kc);
            }

            return cultivoRepository.save(cultivo);
        });
    }

    public void deleteCultivo(Long id) {
        cultivoRepository.deleteById(id);
    }

    public boolean existsById(Long id) {
        return cultivoRepository.existsById(id);
    }

    public Optional<Cultivo> toggleCultivoActive(Long id) {
        return cultivoRepository.findById(id).map(cultivo -> {
            cultivo.setIsActive(!cultivo.getIsActive());
            return cultivoRepository.save(cultivo);
        });
    }
}
