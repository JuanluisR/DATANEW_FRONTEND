package com.datanew.datanew.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.List;

@Service
public class WeatherlinkServiceImpl implements WeatherlinkService {

    private static final Logger log = LoggerFactory.getLogger(WeatherlinkServiceImpl.class);
    private static final String WEATHERLINK_API_BASE = "https://api.weatherlink.com/v2";

    @Value("${weatherlink.api.key}")
    private String defaultApiKey;

    @Value("${weatherlink.api.secret}")
    private String defaultApiSecret;

    @Override
    public List<?> getDevices(String apiKey, String apiSecret) {
        try {
            String urlStr = WEATHERLINK_API_BASE + "/stations?api-key=" + apiKey;
            URL url = new URL(urlStr);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("X-Api-Secret", apiSecret);

            if (conn.getResponseCode() == HttpURLConnection.HTTP_OK) {
                BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = in.readLine()) != null) response.append(line);
                in.close();

                ObjectMapper mapper = new ObjectMapper();
                JsonNode root = mapper.readTree(response.toString());
                JsonNode stations = root.get("stations");
                return mapper.convertValue(stations, List.class);
            }
        } catch (Exception e) {
            log.error("Error fetching Weatherlink devices: {}", e.getMessage());
        }
        return List.of();
    }

    @Override
    public List<?> getCurrentData(Long stationId) {
        try {
            String urlStr = WEATHERLINK_API_BASE + "/current/" + stationId + "?api-key=" + defaultApiKey;
            URL url = new URL(urlStr);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("X-Api-Secret", defaultApiSecret);

            if (conn.getResponseCode() == HttpURLConnection.HTTP_OK) {
                BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = in.readLine()) != null) response.append(line);
                in.close();

                ObjectMapper mapper = new ObjectMapper();
                return mapper.readValue(response.toString(), List.class);
            }
        } catch (Exception e) {
            log.error("Error fetching Weatherlink current data for station {}: {}", stationId, e.getMessage());
        }
        return List.of();
    }
}
