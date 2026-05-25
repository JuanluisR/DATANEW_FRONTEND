package com.datanew.datanew.Controllers;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

import com.datanew.datanew.models.entities.DataStation;
import com.datanew.datanew.models.entities.Station;
import com.datanew.datanew.dto.ClimateStatsDTO;
import com.datanew.datanew.services.DataStationService;
import com.datanew.datanew.services.AlertNotificationService;
import com.datanew.datanew.services.StationsService;
import com.datanew.datanew.services.StationSseService;

@RestController
@RequestMapping("/data")
@Validated
public class DataStationController {

    private static final Logger logger = LoggerFactory.getLogger(DataStationController.class);

    @Autowired
    private DataStationService service;

    @Autowired
    private AlertNotificationService alertNotificationService;

    @Autowired
    private StationsService stationsService;

    @Autowired
    private StationSseService stationSseService;

    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() != null) {
            return authentication.getPrincipal().toString();
        }
        return null;
    }

    private boolean isStationOwnedByUser(String idEstacion, String username) {
        Optional<Station> station = stationsService.getStationsByUser(username).stream()
            .filter(s -> s.getId_estacion().equals(idEstacion))
            .findFirst();
        return station.isPresent();
    }
    
    private boolean isValidApiKeyForStation(String apiKey, String idEstacion) {
        return service.validateApiKeyForStation(apiKey, idEstacion);
    }
    
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        String username = getCurrentUsername();
        if (username == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.UNAUTHORIZED);
        }
        return stationSseService.subscribe(username);
    }

    @GetMapping
public List<DataStation> list(){
        return service.findAll();
}
    
    @GetMapping("/{id}")
public ResponseEntity<?> show(@PathVariable Long id){
        Optional<DataStation> dataOptional = service.findById(id);
        if (dataOptional.isPresent()) {
            return ResponseEntity.ok(dataOptional.orElseThrow());
        }
        return ResponseEntity.notFound().build();
    }

    // Endpoint público para último dato (con API Key)
    @GetMapping("/latest/{idEstacion}")
    public ResponseEntity<?> getLatestByIdEstacion(
            @PathVariable String idEstacion,
            @RequestParam(value = "apiKey", required = false) String apiKey) {
        // Si viene API Key, validar
        if (apiKey != null && !apiKey.isEmpty()) {
            if (!isValidApiKeyForStation(apiKey, idEstacion)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "API Key inválida para esta estación"));
            }
        }
        Optional<DataStation> dataOptional = service.findLatestByIdEstacion(idEstacion);
        if (dataOptional.isPresent()) {
            return ResponseEntity.ok(dataOptional.orElseThrow());
        }
        return ResponseEntity.notFound().build();
    }

    // Endpoint público para estadísticas (con API Key)
    @GetMapping("/stats/{idEstacion}")
    public ResponseEntity<?> getClimateStats(
            @PathVariable String idEstacion,
            @RequestParam(value = "apiKey", required = false) String apiKey) {
        if (apiKey != null && !apiKey.isEmpty()) {
            if (!isValidApiKeyForStation(apiKey, idEstacion)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "API Key inválida para esta estación"));
            }
        }
        Optional<ClimateStatsDTO> statsOptional = service.getClimateStats(idEstacion);
        if (statsOptional.isPresent()) {
            return ResponseEntity.ok(statsOptional.orElseThrow());
        }
        return ResponseEntity.notFound().build();
    }

    // Endpoint público para consulta por rango de fechas (con API Key)
    @GetMapping("/query/{idEstacion}")
    public ResponseEntity<?> queryByDateRange(
            @PathVariable String idEstacion,
            @RequestParam("startDate") String startDate,
            @RequestParam("endDate") String endDate,
            @RequestParam(value = "apiKey", required = false) String apiKey) {
        
        if (apiKey != null && !apiKey.isEmpty()) {
            if (!isValidApiKeyForStation(apiKey, idEstacion)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "API Key inválida para esta estación"));
            }
        }
        
        try {
            logger.info("Query by date range - Station: {}, Start: {}, End: {}", idEstacion, startDate, endDate);
            List<DataStation> data = service.findByDateRangeString(idEstacion, startDate, endDate);
            logger.info("Records found: {}", data.size());
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            logger.error("Error en consulta: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Formato de fecha inválido. Use: yyyy-MM-dd HH:mm:ss"));
        }
    }

    // Endpoint público para histórico de 6 meses (con API Key)
    @GetMapping("/history/{idEstacion}")
    public ResponseEntity<?> getHistory6Months(
            @PathVariable String idEstacion,
            @RequestParam(value = "apiKey", required = false) String apiKey) {
        
        if (apiKey != null && !apiKey.isEmpty()) {
            if (!isValidApiKeyForStation(apiKey, idEstacion)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "API Key inválida para esta estación"));
            }
        }
        
        try {
            LocalDateTime endDate = LocalDateTime.now();
            LocalDateTime startDate = endDate.minusMonths(6);
            
            logger.info("History 6 months - Station: {}, Start: {}, End: {}", idEstacion, startDate, endDate);
            List<DataStation> data = service.findByDateRange(idEstacion, startDate, endDate);
            logger.info("Records found: {}", data.size());
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            logger.error("Error en histórico: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/user/stations")
    public ResponseEntity<?> getUserStations() {
        String username = getCurrentUsername();
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Usuario no autenticado"));
        }
        List<Station> stations = stationsService.getStationsByUser(username);
        return ResponseEntity.ok(stations);
    }

    @GetMapping("/user/{idEstacion}/latest")
    public ResponseEntity<?> getUserLatestByIdEstacion(@PathVariable String idEstacion) {
        String username = getCurrentUsername();
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Usuario no autenticado"));
        }
        if (!isStationOwnedByUser(idEstacion, username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "La estación no pertenece al usuario"));
        }
        Optional<DataStation> dataOptional = service.findLatestByIdEstacion(idEstacion);
        if (dataOptional.isPresent()) {
            return ResponseEntity.ok(dataOptional.orElseThrow());
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/user/{idEstacion}/query")
    public ResponseEntity<?> queryUserByDateRange(
            @PathVariable String idEstacion,
            @org.springframework.web.bind.annotation.RequestParam("startDate") @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime startDate,
            @org.springframework.web.bind.annotation.RequestParam("endDate") @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime endDate) {
        
        String username = getCurrentUsername();
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Usuario no autenticado"));
        }
        if (!isStationOwnedByUser(idEstacion, username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "La estación no pertenece al usuario"));
        }
        
        logger.info("User query by date range - User: {}, Station: {}, Start: {}, End: {}", username, idEstacion, startDate, endDate);
        List<DataStation> data = service.findByDateRange(idEstacion, startDate, endDate);
        logger.info("Records found: {}", data.size());
        return ResponseEntity.ok(data);
    }

    @GetMapping("/user/{idEstacion}/stats")
    public ResponseEntity<?> getUserClimateStats(@PathVariable String idEstacion) {
        String username = getCurrentUsername();
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Usuario no autenticado"));
        }
        if (!isStationOwnedByUser(idEstacion, username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "La estación no pertenece al usuario"));
        }
        Optional<ClimateStatsDTO> statsOptional = service.getClimateStats(idEstacion);
        if (statsOptional.isPresent()) {
            return ResponseEntity.ok(statsOptional.orElseThrow());
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<?> create(@Valid @RequestBody DataStation dataStation){
      DataStation saved = service.save(dataStation);

      // Check alerts for this station after saving new data
      try {
          alertNotificationService.checkAlerts(saved);
      } catch (Exception e) {
          logger.error("Error checking alerts: {}", e.getMessage());
      }

      // Push SSE update to the station owner
      try {
          stationsService.findByIdEstacion(saved.getId_estacion()).ifPresent(station ->
              service.getClimateStats(saved.getId_estacion()).ifPresent(stats ->
                  stationSseService.sendUpdate(station.getUsername(), stats)
              )
          );
      } catch (Exception e) {
          logger.debug("SSE push skipped: {}", e.getMessage());
      }

      return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }



   @DeleteMapping("/{id}") 
public ResponseEntity<?> remove(@PathVariable Long id){
    Optional<DataStation> o= service.findById(id);
    if (o.isPresent()) {
        service.remove(id);
        return ResponseEntity.noContent().build();
    }
    return ResponseEntity.notFound().build();
   }


   @PutMapping("/{id}")
public ResponseEntity<?> update(@Valid @RequestBody DataStation dataStation,
    @PathVariable Long id){
    Optional<DataStation> o = service.update(dataStation, id);
    if (o.isPresent()) {
        return ResponseEntity.status(HttpStatus.CREATED)
        .body(o.orElseThrow());
    }
    return ResponseEntity.notFound().build();
   }
}