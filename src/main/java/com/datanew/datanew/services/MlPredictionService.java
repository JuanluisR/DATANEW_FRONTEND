package com.datanew.datanew.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

@Service
public class MlPredictionService {

    private static final Logger logger = LoggerFactory.getLogger(MlPredictionService.class);

    @Value("${ml.service.url:http://localhost:5000}")
    private String mlServiceUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Sends current station data to the Python ML service and returns predictions.
     *
     * @param payload Map with fields: id_estacion, temp, humidity, pressure,
     *                wind_speed, wind_gust, solar_rad, dewpoint,
     *                precip_rate, precip_today, uv_index
     */
    public Map<String, Object> predict(Map<String, Object> payload) {
        try {
            String body = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(mlServiceUrl + "/predict"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .timeout(Duration.ofMinutes(5))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                return objectMapper.readValue(response.body(), Map.class);
            }

            logger.error("ML service error: status={}, body={}", response.statusCode(), response.body());
            return Map.of("error", "ML service returned status " + response.statusCode());

        } catch (Exception e) {
            logger.error("Failed to call ML service: {}", e.getMessage());
            return Map.of("error", "ML service unavailable: " + e.getMessage());
        }
    }

    /**
     * Triggers model training for a station.
     */
    public Map<String, Object> trainStation(String idEstacion) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(mlServiceUrl + "/train/" + idEstacion))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.noBody())
                    .timeout(Duration.ofMinutes(5))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return objectMapper.readValue(response.body(), Map.class);

        } catch (Exception e) {
            logger.error("Failed to train ML model for {}: {}", idEstacion, e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

    /**
     * Health check on the ML microservice.
     */
    public boolean isHealthy() {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(mlServiceUrl + "/health"))
                    .GET()
                    .timeout(Duration.ofSeconds(5))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200;
        } catch (Exception e) {
            return false;
        }
    }
}
