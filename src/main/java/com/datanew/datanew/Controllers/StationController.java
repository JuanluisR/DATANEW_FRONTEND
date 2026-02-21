package com.datanew.datanew.Controllers;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

import com.datanew.datanew.models.entities.Station;
import com.datanew.datanew.services.StationsService;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;




@RestController
@RequestMapping("/station")
@Validated
public class StationController {

@Autowired
private StationsService service;

@GetMapping
public List<Station> list() {
    return service.getAllStations();
 }
 
@GetMapping("/userstation")
public ResponseEntity<List<Station>> getStationsByUser(@RequestParam("username")String username) {
    List<Station> stations = service.getStationsByUser(username);
    
    return ResponseEntity.ok(stations);
}    


@GetMapping("/{id}")
public ResponseEntity<?> show(@PathVariable Long id){
    Optional<Station> stationOptional = service.findById(id);
    if (stationOptional.isPresent()) {
        return ResponseEntity.ok(stationOptional.orElseThrow());
    }
    return ResponseEntity.notFound().build(); 
}
 



@PostMapping
@ResponseStatus(HttpStatus.CREATED)
public ResponseEntity<?> create(@Valid @RequestBody Station station){
    return ResponseEntity.status(HttpStatus.CREATED)
    .body(service.save(station));
    
}



@PutMapping("/{id}")
public ResponseEntity<?> update(@Valid @RequestBody Station station,
@PathVariable Long id){
    Optional<Station> o = service.update(station, id);
    if (o.isPresent()) {
        
        return ResponseEntity.status(HttpStatus.CREATED)
        .body(o.orElseThrow());
    }    
    return ResponseEntity.notFound().build();
}


    @DeleteMapping("/{id}")
    public ResponseEntity<?> remove(@PathVariable Long id){
        Optional<Station> o = service.findById(id);
        if (o.isPresent()) {
            service.remove(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/weatherlink/devices")
    public ResponseEntity<?> getWeatherlinkDevices(
            @RequestParam("apiKey") String apiKey,
            @RequestParam("apiSecret") String apiSecret) {
        List<?> devices = service.getWeatherlinkDevices(apiKey, apiSecret);
        return ResponseEntity.ok(devices);
    }

    @GetMapping("/weatherlink/current/{stationId}")
    public ResponseEntity<?> getWeatherlinkCurrentData(@PathVariable Long stationId) {
        List<?> data = service.getWeatherlinkCurrentData(stationId);
        return ResponseEntity.ok(data);
    }

    @GetMapping("/geocode")
    public ResponseEntity<?> geocode(@RequestParam("lat") double lat, @RequestParam("lon") double lon) {
        return ResponseEntity.ok(service.geocode(lat, lon));
    }

}