package com.datanew.datanew.Controllers;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import com.datanew.datanew.dto.response.StationResponseDTO;
import com.datanew.datanew.models.entities.Station;
import com.datanew.datanew.services.ExternalLocationService;
import com.datanew.datanew.services.StationsService;
import com.datanew.datanew.services.WeatherlinkService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/station")
@Validated
public class StationController {

    @Autowired
    private StationsService service;

    @Autowired
    private WeatherlinkService weatherlinkService;

    @Autowired
    private ExternalLocationService locationService;

    @GetMapping
    public List<StationResponseDTO> list() {
        return service.getAllStations().stream()
                .map(StationResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @GetMapping("/userstation")
    public ResponseEntity<List<StationResponseDTO>> getStationsByUser(@RequestParam("username") String username) {
        List<StationResponseDTO> result = service.getStationsByUser(username).stream()
                .map(StationResponseDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> show(@PathVariable Long id) {
        Optional<Station> stationOptional = service.findById(id);
        if (stationOptional.isPresent()) {
            return ResponseEntity.ok(StationResponseDTO.fromEntity(stationOptional.get()));
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody Station station) {
        Station saved = service.save(station);
        return ResponseEntity.status(HttpStatus.CREATED).body(StationResponseDTO.fromEntity(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@Valid @RequestBody Station station, @PathVariable Long id) {
        Optional<Station> o = service.update(station, id);
        if (o.isPresent()) {
            return ResponseEntity.ok(StationResponseDTO.fromEntity(o.get()));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> remove(@PathVariable Long id) {
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
        return ResponseEntity.ok(weatherlinkService.getDevices(apiKey, apiSecret));
    }

    @GetMapping("/weatherlink/current/{stationId}")
    public ResponseEntity<?> getWeatherlinkCurrentData(@PathVariable Long stationId) {
        return ResponseEntity.ok(weatherlinkService.getCurrentData(stationId));
    }

    @GetMapping("/geocode")
    public ResponseEntity<?> geocode(@RequestParam("lat") double lat, @RequestParam("lon") double lon) {
        return ResponseEntity.ok(locationService.geocode(lat, lon));
    }
}
