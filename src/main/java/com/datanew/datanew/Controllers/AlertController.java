package com.datanew.datanew.Controllers;

import com.datanew.datanew.models.entities.Alert;
import com.datanew.datanew.services.AlertService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/alert")
@Validated
public class AlertController {

    @Autowired
    private AlertService alertService;

    @GetMapping
    public List<Alert> getAllAlerts() {
        return alertService.getAllAlerts();
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<List<Alert>> getAlertsByUsername(@PathVariable String username) {
        List<Alert> alerts = alertService.getAlertsByUsername(username);
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/user/{username}/active")
    public ResponseEntity<List<Alert>> getActiveAlertsByUsername(@PathVariable String username) {
        List<Alert> alerts = alertService.getActiveAlertsByUsername(username);
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/station/{idEstacion}")
    public ResponseEntity<List<Alert>> getAlertsByStation(@PathVariable String idEstacion) {
        List<Alert> alerts = alertService.getAlertsByStation(idEstacion);
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/station/{idEstacion}/active")
    public ResponseEntity<List<Alert>> getActiveAlertsByStation(@PathVariable String idEstacion) {
        List<Alert> alerts = alertService.getActiveAlertsByStation(idEstacion);
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/active")
    public ResponseEntity<List<Alert>> getAllActiveAlerts() {
        List<Alert> alerts = alertService.getAllActiveAlerts();
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAlertById(@PathVariable Long id) {
        Optional<Alert> alert = alertService.getAlertById(id);
        if (alert.isPresent()) {
            return ResponseEntity.ok(alert.get());
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<Alert> createAlert(@Valid @RequestBody Alert alert) {
        Alert createdAlert = alertService.createAlert(alert);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdAlert);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAlert(@PathVariable Long id, @Valid @RequestBody Alert alertDetails) {
        Optional<Alert> updatedAlert = alertService.updateAlert(id, alertDetails);
        if (updatedAlert.isPresent()) {
            return ResponseEntity.ok(updatedAlert.get());
        }
        return ResponseEntity.notFound().build();
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<?> toggleAlertActive(@PathVariable Long id) {
        Optional<Alert> alert = alertService.toggleAlertActive(id);
        if (alert.isPresent()) {
            return ResponseEntity.ok(alert.get());
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAlert(@PathVariable Long id) {
        if (alertService.existsById(id)) {
            alertService.deleteAlert(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
