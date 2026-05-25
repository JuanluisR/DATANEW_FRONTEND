package com.datanew.datanew.Controllers;

import com.datanew.datanew.models.entities.Cultivo;
import com.datanew.datanew.services.BalanceHidricoService;
import com.datanew.datanew.services.CultivoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/cultivo")
@Validated
public class CultivoController {

    @Autowired
    private CultivoService cultivoService;

    @Autowired
    private BalanceHidricoService balanceHidricoService;

    @GetMapping
    public List<Cultivo> getAllCultivos() {
        return cultivoService.getAllCultivos();
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<List<Cultivo>> getCultivosByUsername(@PathVariable String username) {
        List<Cultivo> cultivos = cultivoService.getCultivosByUsername(username);
        return ResponseEntity.ok(cultivos);
    }

    @GetMapping("/user/{username}/active")
    public ResponseEntity<List<Cultivo>> getActiveCultivosByUsername(@PathVariable String username) {
        List<Cultivo> cultivos = cultivoService.getActiveCultivosByUsername(username);
        return ResponseEntity.ok(cultivos);
    }

    @GetMapping("/station/{idEstacion}")
    public ResponseEntity<List<Cultivo>> getCultivosByStation(@PathVariable String idEstacion) {
        List<Cultivo> cultivos = cultivoService.getCultivosByStation(idEstacion);
        return ResponseEntity.ok(cultivos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCultivoById(@PathVariable Long id) {
        return cultivoService.getCultivoById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Cultivo> createCultivo(@Valid @RequestBody Cultivo cultivo) {
        Cultivo createdCultivo = cultivoService.createCultivo(cultivo);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdCultivo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCultivo(@PathVariable Long id, @Valid @RequestBody Cultivo cultivoDetails) {
        return cultivoService.updateCultivo(id, cultivoDetails)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<?> toggleCultivoActive(@PathVariable Long id) {
        return cultivoService.toggleCultivoActive(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCultivo(@PathVariable Long id) {
        if (cultivoService.existsById(id)) {
            cultivoService.deleteCultivo(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // Endpoints de Balance Hídrico

    @GetMapping("/{id}/balance/hoy")
    public ResponseEntity<Map<String, Object>> getBalanceHoy(@PathVariable Long id) {
        return cultivoService.getCultivoById(id)
                .map(cultivo -> {
                    Map<String, Object> balance = balanceHidricoService.calcularBalanceDiario(cultivo, LocalDate.now());
                    return ResponseEntity.ok(balance);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/balance/fecha/{fecha}")
    public ResponseEntity<Map<String, Object>> getBalanceFecha(
            @PathVariable Long id,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return cultivoService.getCultivoById(id)
                .map(cultivo -> {
                    Map<String, Object> balance = balanceHidricoService.calcularBalanceDiario(cultivo, fecha);
                    return ResponseEntity.ok(balance);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/balance/rango")
    public ResponseEntity<List<Map<String, Object>>> getBalanceRango(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {
        return cultivoService.getCultivoById(id)
                .map(cultivo -> {
                    List<Map<String, Object>> balances = balanceHidricoService.calcularBalanceRango(cultivo, fechaInicio, fechaFin);
                    return ResponseEntity.ok(balances);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/info/{tipoCultivo}")
    public ResponseEntity<Map<String, Object>> getInfoCultivo(@PathVariable String tipoCultivo) {
        Map<String, Object> info = balanceHidricoService.getInfoCultivo(tipoCultivo);
        return ResponseEntity.ok(info);
    }
}
