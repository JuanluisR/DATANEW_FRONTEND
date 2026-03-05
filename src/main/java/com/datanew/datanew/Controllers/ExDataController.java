package com.datanew.datanew.Controllers;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.datanew.datanew.models.entities.ExData;
import com.datanew.datanew.services.ExDataService;

@RestController
@RequestMapping("/ex-data")
public class ExDataController {

    @Autowired
    private ExDataService service;

    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        return auth.getName();
    }

    @GetMapping("/sensor/{idSensor}/latest")
    public ResponseEntity<?> getLatestBySensor(@PathVariable String idSensor) {
        if (getCurrentUsername() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Usuario no autenticado"));
        }
        Optional<ExData> result = service.findLatestBySensor(idSensor);
        if (result.isPresent()) {
            return ResponseEntity.ok(result.get());
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/sensor/{idSensor}")
    public ResponseEntity<?> getBySensor(@PathVariable String idSensor) {
        if (getCurrentUsername() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Usuario no autenticado"));
        }
        List<ExData> result = service.findBySensor(idSensor);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/station/{idEstacion}")
    public ResponseEntity<?> getByStation(@PathVariable String idEstacion) {
        if (getCurrentUsername() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Usuario no autenticado"));
        }
        List<ExData> result = service.findByEstacion(idEstacion);
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody ExData exData) {
        if (getCurrentUsername() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Usuario no autenticado"));
        }
        ExData saved = service.save(exData);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (getCurrentUsername() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Usuario no autenticado"));
        }
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
