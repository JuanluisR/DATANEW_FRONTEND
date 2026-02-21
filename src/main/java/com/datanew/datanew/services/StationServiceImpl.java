package com.datanew.datanew.services;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.datanew.datanew.models.entities.Station;
import com.datanew.datanew.repositories.StationRepository;
import com.datanew.datanew.repositories.StationUserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class StationServiceImpl implements StationsService {

    @Autowired
    private StationRepository repository;

    @Autowired
    private StationUserRepository stationUserRepository;
    
    private static final String WEATHERLINK_API_BASE = "https://api.weatherlink.com/v2";
    private static final String WEATHERLINK_API_KEY = "msixyxin6nhtljrz3hhvascbz6fcnaoo";
    private static final String WEATHERLINK_API_SECRET = "orczfod8vasm91jpxydxh8cvi4rgv4wi";
    


    @Override
@Transactional(readOnly = true)
    public List<Station> getAllStations() {

        return (List<Station>) repository.findAll();
    }

     
    @Override
    @Transactional(readOnly = true)
    public List<Station> getStationsByUser(String username) {
        List<Station> stations = stationUserRepository.getstationsUser(username);
        
        return stations;        
    } 

    @Override
    @Transactional(readOnly = true)
    public Optional<Station> findById(Long id) {
       
       return repository.findById(id) ;
    }

    @Override
    @Transactional
    public Station save(Station station) {
       
     return repository.save(station);  
    }

    @Override
    @Transactional
    public void remove(Long id) {
        repository.deleteById(id);
    }

    @Override
    @Transactional
    public Optional<Station> update(Station station, Long id) {
         Optional<Station> o = findById(id); 
    if (o.isPresent()) {
        Station stationDb = o.orElseThrow();
        stationDb.setNombre_estacion(station.getNombre_estacion());
       
        stationDb.setLat(station.getLat());
        stationDb.setLon(station.getLon());
        stationDb.setForecast_key(station.getForecast_key());
        stationDb.setElevacion(station.getElevacion());
        stationDb.setAltura_suelo(station.getAltura_suelo());
        stationDb.setDepartamento(station.getDepartamento());
        stationDb.setCiudad(station.getCiudad());
        stationDb.setEstado(station.getEstado());
        stationDb.setPais(station.getPais());
        stationDb.setMarca(station.getMarca());
        stationDb.setModelo(station.getModelo());
        stationDb.setKey(station.getKey());
        stationDb.setPasskey(station.getPasskey());
        stationDb.setUsername(station.getUsername());
        stationDb.setWeatherlink_id(station.getWeatherlink_id());
        stationDb.setApi_key(station.getApi_key());
        stationDb.setApi_secret(station.getApi_secret());
        stationDb.setImei(station.getImei());
        stationDb.setFreq(station.getFreq());
        return Optional.of(save(stationDb)) ;
    }
        return Optional.empty();
    }

    @Override
    public List<?> getWeatherlinkDevices(String apiKey, String apiSecret) {
        try {
            String urlStr = WEATHERLINK_API_BASE + "/stations?api-key=" + apiKey;
            URL url = new URL(urlStr);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("X-Api-Secret", apiSecret);
            
            int responseCode = conn.getResponseCode();
            if (responseCode == HttpURLConnection.HTTP_OK) {
                BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = in.readLine()) != null) {
                    response.append(line);
                }
                in.close();
                
                ObjectMapper mapper = new ObjectMapper();
                JsonNode root = mapper.readTree(response.toString());
                JsonNode stations = root.get("stations");
                
                return mapper.convertValue(stations, List.class);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return List.of();
    }
    
    public List<?> getWeatherlinkCurrentData(Long stationId) {
        try {
            String urlStr = WEATHERLINK_API_BASE + "/current/" + stationId + "?api-key=" + WEATHERLINK_API_KEY;
            URL url = new URL(urlStr);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("X-Api-Secret", WEATHERLINK_API_SECRET);
            
            int responseCode = conn.getResponseCode();
            if (responseCode == HttpURLConnection.HTTP_OK) {
                BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = in.readLine()) != null) {
                    response.append(line);
                }
                in.close();
                
                ObjectMapper mapper = new ObjectMapper();
                return mapper.readValue(response.toString(), List.class);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return List.of();
    }

    @Override
    public java.util.Map<String, Object> geocode(double lat, double lon) {
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        try {
            // Reverse geocoding with Nominatim
            String nominatimUrl = "https://nominatim.openstreetmap.org/reverse?lat=" + lat + "&lon=" + lon + "&format=json&accept-language=es";
            URL url = new URL(nominatimUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("User-Agent", "DataNewWeather/1.0");
            
            if (conn.getResponseCode() == HttpURLConnection.HTTP_OK) {
                BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = in.readLine()) != null) {
                    response.append(line);
                }
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
            
            // Get elevation from Open-Elevation
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
                    while ((line = in.readLine()) != null) {
                        response.append(line);
                    }
                    in.close();
                    
                    ObjectMapper mapper = new ObjectMapper();
                    JsonNode elevData = mapper.readTree(response.toString());
                    if (elevData.has("results") && elevData.get("results").size() > 0) {
                        result.put("elevacion", elevData.get("results").get(0).get("elevation").asInt());
                    }
                }
            } catch (Exception e) {
                // Elevation is optional, ignore errors
            }
            
        } catch (Exception e) {
            e.printStackTrace();
        }
        return result;
    }

}
