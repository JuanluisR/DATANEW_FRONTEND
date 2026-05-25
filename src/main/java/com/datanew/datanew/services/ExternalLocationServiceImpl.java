package com.datanew.datanew.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;

@Service
public class ExternalLocationServiceImpl implements ExternalLocationService {

    private static final Logger log = LoggerFactory.getLogger(ExternalLocationServiceImpl.class);

    @Override
    public Map<String, Object> geocode(double lat, double lon) {
        Map<String, Object> result = new HashMap<>();
        try {
            String nominatimUrl = "https://nominatim.openstreetmap.org/reverse?lat=" + lat + "&lon=" + lon + "&format=json&accept-language=es";
            URL url = new URL(nominatimUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("User-Agent", "DataNewWeather/1.0");

            if (conn.getResponseCode() == HttpURLConnection.HTTP_OK) {
                BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = in.readLine()) != null) response.append(line);
                in.close();

                ObjectMapper mapper = new ObjectMapper();
                JsonNode data = mapper.readTree(response.toString());

                if (data.has("address")) {
                    JsonNode addr = data.get("address");
                    result.put("departamento",
                        addr.has("state") ? addr.get("state").asText() :
                        addr.has("county") ? addr.get("county").asText() : "");
                    result.put("ciudad",
                        addr.has("city") ? addr.get("city").asText() :
                        addr.has("town") ? addr.get("town").asText() :
                        addr.has("municipality") ? addr.get("municipality").asText() : "");
                    result.put("pais", addr.has("country") ? addr.get("country").asText() : "");
                }
            }

            try {
                String elevationUrl = "https://api.open-elevation.com/api/v1/lookup?locations=" + lat + "," + lon;
                URL elevUrl = new URL(elevationUrl);
                HttpURLConnection elevConn = (HttpURLConnection) elevUrl.openConnection();
                elevConn.setRequestMethod("GET");
                elevConn.setRequestProperty("User-Agent", "DataNewWeather/1.0");

                if (elevConn.getResponseCode() == HttpURLConnection.HTTP_OK) {
                    BufferedReader in = new BufferedReader(new InputStreamReader(elevConn.getInputStream()));
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = in.readLine()) != null) response.append(line);
                    in.close();

                    ObjectMapper mapper = new ObjectMapper();
                    JsonNode elevData = mapper.readTree(response.toString());
                    if (elevData.has("results") && elevData.get("results").size() > 0) {
                        result.put("elevacion", elevData.get("results").get(0).get("elevation").asInt());
                    }
                }
            } catch (Exception e) {
                log.warn("Could not fetch elevation for lat={} lon={}: {}", lat, lon, e.getMessage());
            }

        } catch (Exception e) {
            log.error("Error during geocoding lat={} lon={}: {}", lat, lon, e.getMessage());
        }
        return result;
    }
}
