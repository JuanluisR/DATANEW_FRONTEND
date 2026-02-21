package com.datanew.datanew.Controllers;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;

import com.datanew.datanew.models.entities.Sensor;
import com.datanew.datanew.services.SensorService;



@RestController
@RequestMapping("/sensores")
@Validated
public class SensorController {

@Autowired
    private SensorService service;
    @GetMapping
    public List<Sensor> list(){
        return service.findAll();
    }
    @GetMapping("/{sensor_id}")
    public ResponseEntity<?> show(@PathVariable Long sensor_id) {
        Optional<Sensor> sensorOptional = service.findById(sensor_id);
        if (sensorOptional.isPresent()) {
            return ResponseEntity.ok(sensorOptional.orElseThrow());

        }
        
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/station/{idEstacion}")
    public ResponseEntity<?> getByStation(@PathVariable String idEstacion) {
        List<Sensor> sensores = service.findByIdEstacion(idEstacion);
        return ResponseEntity.ok(sensores);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<?> create(@Valid @RequestBody Sensor sensor) {
        
        return ResponseEntity.status(HttpStatus.CREATED).body(service.save(sensor));
    }
    
   @PutMapping("/{sensor_id}")
public ResponseEntity<?> update(@Valid @RequestBody Sensor sensor,
    @PathVariable Long sensor_id) {
        Optional<Sensor> o= service.update(sensor, sensor_id);
        if (o.isPresent()) {
            return ResponseEntity.status(HttpStatus.CREATED)
            .body(o.orElseThrow());
        }      
       return ResponseEntity.notFound().build();
   }
   
   @DeleteMapping("/{sensor_id}")
public ResponseEntity<?> remove(@PathVariable Long sensor_id){
    Optional<Sensor> o= service.findById(sensor_id);
    if (o.isPresent()) {
        service.remove(sensor_id);
        return ResponseEntity.noContent().build();
    }
    return ResponseEntity.notFound().build();
   }
}