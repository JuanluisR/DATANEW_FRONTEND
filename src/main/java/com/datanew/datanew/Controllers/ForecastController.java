package com.datanew.datanew.Controllers;

import com.datanew.datanew.services.ForecastService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/forecast")
public class ForecastController {

    private static final Logger logger = LoggerFactory.getLogger(ForecastController.class);

    @Autowired
    private ForecastService forecastService;

    /**
     * Get 7-day weather forecast for given coordinates
     * @param lat Latitude
     * @param lon Longitude
     * @return List of daily forecasts
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getForecast(
            @RequestParam double lat,
            @RequestParam double lon) {

        logger.info("Forecast request received - lat: {}, lon: {}", lat, lon);

        // Validate coordinates
        if (lat < -90 || lat > 90) {
            logger.error("Invalid latitude: {}. Must be between -90 and 90.", lat);
            return ResponseEntity.badRequest().build();
        }
        if (lon < -180 || lon > 180) {
            logger.error("Invalid longitude: {}. Must be between -180 and 180.", lon);
            return ResponseEntity.badRequest().build();
        }

        List<Map<String, Object>> forecast = forecastService.getForecast(lat, lon);

        if (forecast.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(forecast);
    }
}
