package com.datanew.datanew.services;

import com.datanew.datanew.models.entities.Alert;
import com.datanew.datanew.repositories.AlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AlertService {

    @Autowired
    private AlertRepository alertRepository;

    public List<Alert> getAllAlerts() {
        return alertRepository.findAll();
    }

    public List<Alert> getAlertsByUsername(String username) {
        return alertRepository.findByUsernameOrderByFechaCreacionDesc(username);
    }

    public List<Alert> getActiveAlertsByUsername(String username) {
        return alertRepository.findByUsernameAndIsActiveTrue(username);
    }

    public List<Alert> getAlertsByStation(String idEstacion) {
        return alertRepository.findByIdEstacion(idEstacion);
    }

    public List<Alert> getActiveAlertsByStation(String idEstacion) {
        return alertRepository.findByIdEstacionAndIsActiveTrue(idEstacion);
    }

    public List<Alert> getAllActiveAlerts() {
        return alertRepository.findByIsActiveTrue();
    }

    public Optional<Alert> getAlertById(Long id) {
        return alertRepository.findById(id);
    }

    public Alert createAlert(Alert alert) {
        return alertRepository.save(alert);
    }

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

    public Optional<Alert> toggleAlertActive(Long id) {
        return alertRepository.findById(id).map(alert -> {
            alert.setIsActive(!alert.getIsActive());
            return alertRepository.save(alert);
        });
    }

    public void deleteAlert(Long id) {
        alertRepository.deleteById(id);
    }

    public boolean existsById(Long id) {
        return alertRepository.existsById(id);
    }
}
