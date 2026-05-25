package com.datanew.datanew.Controllers;

import com.datanew.datanew.models.entities.Alert;
import com.datanew.datanew.services.AlertService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
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

    private String getAuthenticatedUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping
    public List<Alert> getAllAlerts() {
        return alertService.getAllAlerts();
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<?> getAlertsByUsername(@PathVariable String username) {
        if (!getAuthenticatedUsername().equals(username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(alertService.getAlertsByUsername(username));
    }

    @GetMapping("/user/{username}/active")
    public ResponseEntity<?> getActiveAlertsByUsername(@PathVariable String username) {
        if (!getAuthenticatedUsername().equals(username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(alertService.getActiveAlertsByUsername(username));
    }

    @GetMapping("/station/{idEstacion}")
    public ResponseEntity<List<Alert>> getAlertsByStation(@PathVariable String idEstacion) {
        return ResponseEntity.ok(alertService.getAlertsByStation(idEstacion));
    }

    @GetMapping("/station/{idEstacion}/active")
    public ResponseEntity<List<Alert>> getActiveAlertsByStation(@PathVariable String idEstacion) {
        return ResponseEntity.ok(alertService.getActiveAlertsByStation(idEstacion));
    }

    @GetMapping("/active")
    public ResponseEntity<List<Alert>> getAllActiveAlerts() {
        return ResponseEntity.ok(alertService.getAllActiveAlerts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAlertById(@PathVariable Long id) {
        Optional<Alert> alert = alertService.getAlertById(id);
        if (alert.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (!getAuthenticatedUsername().equals(alert.get().getUsername())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(alert.get());
    }

    @PostMapping
    public ResponseEntity<?> createAlert(@Valid @RequestBody Alert alert) {
        alert.setUsername(getAuthenticatedUsername());
        Alert created = alertService.createAlert(alert);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAlert(@PathVariable Long id, @Valid @RequestBody Alert alertDetails) {
        Optional<Alert> existing = alertService.getAlertById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (!getAuthenticatedUsername().equals(existing.get().getUsername())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return alertService.updateAlert(id, alertDetails)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<?> toggleAlertActive(@PathVariable Long id) {
        Optional<Alert> existing = alertService.getAlertById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (!getAuthenticatedUsername().equals(existing.get().getUsername())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return alertService.toggleAlertActive(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAlert(@PathVariable Long id) {
        Optional<Alert> existing = alertService.getAlertById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (!getAuthenticatedUsername().equals(existing.get().getUsername())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        alertService.deleteAlert(id);
        return ResponseEntity.noContent().build();
    }
}
