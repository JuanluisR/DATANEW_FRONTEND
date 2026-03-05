package com.datanew.datanew.Controllers;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import com.datanew.datanew.dto.response.SensorResponseDTO;
import com.datanew.datanew.models.entities.Sensor;
import com.datanew.datanew.services.SensorService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/sensores")
@Validated
public class SensorController {

    @Autowired
    private SensorService service;

    @GetMapping
    public List<SensorResponseDTO> list() {
        return service.findAll().stream()
                .map(SensorResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @GetMapping("/{sensor_id}")
    public ResponseEntity<?> show(@PathVariable Long sensor_id) {
        Optional<Sensor> sensorOptional = service.findById(sensor_id);
        if (sensorOptional.isPresent()) {
            return ResponseEntity.ok(SensorResponseDTO.fromEntity(sensorOptional.get()));
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/station/{idEstacion}")
    public ResponseEntity<?> getByStation(@PathVariable String idEstacion) {
        List<SensorResponseDTO> result = service.findByIdEstacion(idEstacion).stream()
                .map(SensorResponseDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody Sensor sensor) {
        if (sensor.getId_sensor() != null && !sensor.getId_sensor().isBlank()
                && sensor.getCanal() != null && sensor.getTipo_sensor() != null) {
            if (service.existsDuplicate(sensor.getId_sensor(), sensor.getCanal(),
                    sensor.getTipo_sensor(), sensor.getUsername(), null)) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "Ya existe un sensor con el mismo ID, canal, tipo y usuario"));
            }
        }
        Sensor saved = service.save(sensor);
        return ResponseEntity.status(HttpStatus.CREATED).body(SensorResponseDTO.fromEntity(saved));
    }

    @PutMapping("/{sensor_id}")
    public ResponseEntity<?> update(@Valid @RequestBody Sensor sensor, @PathVariable Long sensor_id) {
        if (sensor.getId_sensor() != null && !sensor.getId_sensor().isBlank()
                && sensor.getCanal() != null && sensor.getTipo_sensor() != null) {
            if (service.existsDuplicate(sensor.getId_sensor(), sensor.getCanal(),
                    sensor.getTipo_sensor(), sensor.getUsername(), sensor_id)) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "Ya existe un sensor con el mismo ID, canal, tipo y usuario"));
            }
        }
        Optional<Sensor> o = service.update(sensor, sensor_id);
        if (o.isPresent()) {
            return ResponseEntity.ok(SensorResponseDTO.fromEntity(o.get()));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{sensor_id}")
    public ResponseEntity<?> remove(@PathVariable Long sensor_id) {
        Optional<Sensor> o = service.findById(sensor_id);
        if (o.isPresent()) {
            service.remove(sensor_id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
