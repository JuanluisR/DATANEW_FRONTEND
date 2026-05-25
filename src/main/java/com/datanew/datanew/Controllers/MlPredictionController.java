package com.datanew.datanew.Controllers;

import com.datanew.datanew.dto.ClimateStatsDTO;
import com.datanew.datanew.services.DataStationService;
import com.datanew.datanew.services.MlPredictionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/ml")
public class MlPredictionController {

    @Autowired
    private MlPredictionService mlService;

    @Autowired
    private DataStationService dataStationService;

    /**
     * GET /ml/predict/{idEstacion}
     * Obtiene predicciones para una estación usando sus datos más recientes.
     * Spring toma el último registro de la BD y lo envía al microservicio Python.
     */
    @GetMapping("/predict/{idEstacion}")
    public ResponseEntity<?> predict(@PathVariable String idEstacion) {
        // Load latest stats from the existing service
        Optional<ClimateStatsDTO> statsOpt = dataStationService.getClimateStats(idEstacion);
        if (statsOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ClimateStatsDTO stats = statsOpt.get();

        // Build payload matching Python schema
        Map<String, Object> payload = new HashMap<>();
        payload.put("id_estacion", idEstacion);
        payload.put("temp",         stats.getTempCurrent());
        payload.put("humidity",     stats.getHumidityCurrent());
        payload.put("pressure",     stats.getPressureCurrent());
        payload.put("wind_speed",   stats.getWindSpeedCurrent());
        payload.put("wind_gust",    stats.getWindGustCurrent());
        payload.put("solar_rad",    stats.getSolarRadCurrent());
        payload.put("dewpoint",     stats.getDewpointCurrent());
        payload.put("precip_rate",  stats.getPrecipCurrent());
        payload.put("precip_today", stats.getPrecipMax());
        payload.put("uv_index",     null);

        Map<String, Object> result = mlService.predict(payload);
        return ResponseEntity.ok(result);
    }

    /**
     * POST /ml/train/{idEstacion}
     * Dispara el entrenamiento del modelo para una estación.
     */
    @PostMapping("/train/{idEstacion}")
    public ResponseEntity<?> train(@PathVariable String idEstacion) {
        Map<String, Object> result = mlService.trainStation(idEstacion);
        return ResponseEntity.ok(result);
    }

    /**
     * GET /ml/health
     * Verifica si el microservicio Python está disponible.
     */
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        boolean healthy = mlService.isHealthy();
        return ResponseEntity.ok(Map.of(
                "ml_service", healthy ? "up" : "down"
        ));
    }
}
