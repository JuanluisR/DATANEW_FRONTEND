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
public class CultivoServiceImpl implements CultivoService {

    @Autowired
    private CultivoRepository cultivoRepository;

    @Autowired
    private BalanceHidricoService balanceHidricoService;

    @Override
    public List<Cultivo> getAllCultivos() {
        return cultivoRepository.findAll();
    }

    @Override
    public List<Cultivo> getCultivosByUsername(String username) {
        return cultivoRepository.findByUsernameOrderByFechaCreacionDesc(username);
    }

    @Override
    public List<Cultivo> getActiveCultivosByUsername(String username) {
        return cultivoRepository.findByUsernameAndIsActiveTrue(username);
    }

    @Override
    public List<Cultivo> getCultivosByStation(String idEstacion) {
        return cultivoRepository.findByIdEstacion(idEstacion);
    }

    @Override
    public Optional<Cultivo> getCultivoById(Long id) {
        return cultivoRepository.findById(id);
    }

    @Override
    public Cultivo createCultivo(Cultivo cultivo) {
        if (cultivo.getFechaSiembra() != null) {
            int dias = (int) ChronoUnit.DAYS.between(cultivo.getFechaSiembra(), LocalDate.now());
            cultivo.setDiasDesdeSiembra(dias);
            String etapa = balanceHidricoService.calcularEtapaActual(cultivo.getTipoCultivo(), dias);
            cultivo.setEtapaActual(etapa);
            Double kc = balanceHidricoService.getKc(cultivo.getTipoCultivo(), etapa);
            cultivo.setKcActual(kc);
        }
        return cultivoRepository.save(cultivo);
    }

    @Override
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

            if (cultivo.getFechaSiembra() != null) {
                int dias = (int) ChronoUnit.DAYS.between(cultivo.getFechaSiembra(), LocalDate.now());
                cultivo.setDiasDesdeSiembra(dias);
                String etapa = balanceHidricoService.calcularEtapaActual(cultivo.getTipoCultivo(), dias);
                cultivo.setEtapaActual(etapa);
                Double kc = balanceHidricoService.getKc(cultivo.getTipoCultivo(), etapa);
                cultivo.setKcActual(kc);
            }
            return cultivoRepository.save(cultivo);
        });
    }

    @Override
    public void deleteCultivo(Long id) {
        cultivoRepository.deleteById(id);
    }

    @Override
    public boolean existsById(Long id) {
        return cultivoRepository.existsById(id);
    }

    @Override
    public Optional<Cultivo> toggleCultivoActive(Long id) {
        return cultivoRepository.findById(id).map(cultivo -> {
            cultivo.setIsActive(!cultivo.getIsActive());
            return cultivoRepository.save(cultivo);
        });
    }
}
