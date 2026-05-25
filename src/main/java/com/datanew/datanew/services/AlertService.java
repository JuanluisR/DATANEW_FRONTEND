package com.datanew.datanew.services;

import com.datanew.datanew.models.entities.Alert;

import java.util.List;
import java.util.Optional;

public interface AlertService {

    List<Alert> getAllAlerts();

    List<Alert> getAlertsByUsername(String username);

    List<Alert> getActiveAlertsByUsername(String username);

    List<Alert> getAlertsByStation(String idEstacion);

    List<Alert> getActiveAlertsByStation(String idEstacion);

    List<Alert> getAllActiveAlerts();

    Optional<Alert> getAlertById(Long id);

    Alert createAlert(Alert alert);

    Optional<Alert> updateAlert(Long id, Alert alertDetails);

    Optional<Alert> toggleAlertActive(Long id);

    void deleteAlert(Long id);

    boolean existsById(Long id);
}
