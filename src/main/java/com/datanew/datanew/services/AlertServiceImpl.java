package com.datanew.datanew.services;

import com.datanew.datanew.models.entities.Alert;
import com.datanew.datanew.repositories.AlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AlertServiceImpl implements AlertService {

    @Autowired
    private AlertRepository alertRepository;

    @Override
    public List<Alert> getAllAlerts() {
        return alertRepository.findAll();
    }

    @Override
    public List<Alert> getAlertsByUsername(String username) {
        return alertRepository.findByUsernameOrderByFechaCreacionDesc(username);
    }

    @Override
    public List<Alert> getActiveAlertsByUsername(String username) {
        return alertRepository.findByUsernameAndIsActiveTrue(username);
    }

    @Override
    public List<Alert> getAlertsByStation(String idEstacion) {
        return alertRepository.findByIdEstacion(idEstacion);
    }

    @Override
    public List<Alert> getActiveAlertsByStation(String idEstacion) {
        return alertRepository.findByIdEstacionAndIsActiveTrue(idEstacion);
    }

    @Override
    public List<Alert> getAllActiveAlerts() {
        return alertRepository.findByIsActiveTrue();
    }

    @Override
    public Optional<Alert> getAlertById(Long id) {
        return alertRepository.findById(id);
    }

    @Override
    public Alert createAlert(Alert alert) {
        return alertRepository.save(alert);
    }

    @Override
    public Optional<Alert> updateAlert(Long id, Alert alertDetails) {
        return alertRepository.findById(id).map(alert -> {
            alert.setNombreAlerta(alertDetails.getNombreAlerta());
            alert.setIdEstacion(alertDetails.getIdEstacion());
            alert.setNombreEstacion(alertDetails.getNombreEstacion());
            alert.setVariable(alertDetails.getVariable());
            alert.setOperador(alertDetails.getOperador());
            alert.setValorUmbral(alertDetails.getValorUmbral());
            alert.setUnidad(alertDetails.getUnidad());
            alert.setNotificarEmail(alertDetails.getNotificarEmail());
            alert.setNotificarSms(alertDetails.getNotificarSms());
            alert.setEmails(alertDetails.getEmails());
            alert.setTelefonos(alertDetails.getTelefonos());
            alert.setIsActive(alertDetails.getIsActive());
            return alertRepository.save(alert);
        });
    }

    @Override
    public Optional<Alert> toggleAlertActive(Long id) {
        return alertRepository.findById(id).map(alert -> {
            alert.setIsActive(!alert.getIsActive());
            return alertRepository.save(alert);
        });
    }

    @Override
    public void deleteAlert(Long id) {
        alertRepository.deleteById(id);
    }

    @Override
    public boolean existsById(Long id) {
        return alertRepository.existsById(id);
    }
}
