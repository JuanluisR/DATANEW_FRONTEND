package com.datanew.datanew.services;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.*;

@Service
public class ForecastService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public ForecastService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Fetches 7-day weather forecast from Open-Meteo API (free, no API key required)
     * Now includes hourly data for charts
     */
    public List<Map<String, Object>> getForecast(double lat, double lon) {
        List<Map<String, Object>> forecasts = new ArrayList<>();

        try {
            // Open-Meteo API URL with daily and hourly forecast parameters
            // Use Locale.US to ensure period as decimal separator (not comma)
            String url = String.format(Locale.US,
                "https://api.open-meteo.com/v1/forecast?" +
                "latitude=%.6f&longitude=%.6f&" +
                "daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max," +
                "weathercode,windspeed_10m_max,relative_humidity_2m_max,relative_humidity_2m_min," +
                "uv_index_max,winddirection_10m_dominant,shortwave_radiation_sum,et0_fao_evapotranspiration&" +
                "hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation," +
                "weathercode,windspeed_10m,apparent_temperature,uv_index,winddirection_10m,direct_radiation&" +
                "current=temperature_2m,relative_humidity_2m,weathercode,windspeed_10m,winddirection_10m,uv_index,direct_radiation&" +
                "current_weather=true&" +
                "timezone=auto&" +
                "forecast_days=7",
                lat, lon
            );

            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode daily = root.get("daily");
                JsonNode hourly = root.get("hourly");
                JsonNode currentWeather = root.get("current_weather");
                JsonNode current = root.get("current");

                if (daily != null) {
                    JsonNode dates = daily.get("time");
                    JsonNode tempMax = daily.get("temperature_2m_max");
                    JsonNode tempMin = daily.get("temperature_2m_min");
                    JsonNode precipitation = daily.get("precipitation_sum");
                    JsonNode precipitationProb = daily.get("precipitation_probability_max");
                    JsonNode weatherCode = daily.get("weathercode");
                    JsonNode windSpeed = daily.get("windspeed_10m_max");
                    JsonNode humidityMax = daily.get("relative_humidity_2m_max");
                    JsonNode humidityMin = daily.get("relative_humidity_2m_min");
                    JsonNode uvIndex = daily.get("uv_index_max");
                    JsonNode windDirection = daily.get("winddirection_10m_dominant");
                    JsonNode solarRadiation = daily.get("shortwave_radiation_sum");
                    JsonNode eto = daily.get("et0_fao_evapotranspiration");

                    // Hourly data arrays
                    JsonNode hourlyTime = hourly != null ? hourly.get("time") : null;
                    JsonNode hourlyTemp = hourly != null ? hourly.get("temperature_2m") : null;
                    JsonNode hourlyHumidity = hourly != null ? hourly.get("relative_humidity_2m") : null;
                    JsonNode hourlyPrecipProb = hourly != null ? hourly.get("precipitation_probability") : null;
                    JsonNode hourlyPrecip = hourly != null ? hourly.get("precipitation") : null;
                    JsonNode hourlyWind = hourly != null ? hourly.get("windspeed_10m") : null;
                    JsonNode hourlyApparent = hourly != null ? hourly.get("apparent_temperature") : null;
                    JsonNode hourlyUv = hourly != null ? hourly.get("uv_index") : null;
                    JsonNode hourlyWindDir = hourly != null ? hourly.get("winddirection_10m") : null;
                    JsonNode hourlyDirectRad = hourly != null ? hourly.get("direct_radiation") : null;

                    for (int i = 0; i < dates.size() && i < 7; i++) {
                        Map<String, Object> dayForecast = new HashMap<>();
                        dayForecast.put("date", dates.get(i).asText());
                        dayForecast.put("tempMax", tempMax != null && !tempMax.get(i).isNull() ? tempMax.get(i).asDouble() : null);
                        dayForecast.put("tempMin", tempMin != null && !tempMin.get(i).isNull() ? tempMin.get(i).asDouble() : null);
                        dayForecast.put("precipitation", precipitation != null && !precipitation.get(i).isNull() ? precipitation.get(i).asDouble() : 0);
                        dayForecast.put("precipitationProbability", precipitationProb != null && !precipitationProb.get(i).isNull() ? precipitationProb.get(i).asInt() : 0);
                        dayForecast.put("weatherCode", weatherCode != null && !weatherCode.get(i).isNull() ? weatherCode.get(i).asInt() : 0);
                        dayForecast.put("windSpeed", windSpeed != null && !windSpeed.get(i).isNull() ? windSpeed.get(i).asDouble() : null);
                        dayForecast.put("humidityMax", humidityMax != null && !humidityMax.get(i).isNull() ? humidityMax.get(i).asInt() : null);
                        dayForecast.put("humidityMin", humidityMin != null && !humidityMin.get(i).isNull() ? humidityMin.get(i).asInt() : null);
                        dayForecast.put("uvIndex", uvIndex != null && !uvIndex.get(i).isNull() ? uvIndex.get(i).asDouble() : null);
                        dayForecast.put("windDirection", windDirection != null && !windDirection.get(i).isNull() ? windDirection.get(i).asInt() : null);
                        dayForecast.put("solarRadiation", solarRadiation != null && !solarRadiation.get(i).isNull() ? solarRadiation.get(i).asDouble() : null);
                        dayForecast.put("eto", eto != null && !eto.get(i).isNull() ? eto.get(i).asDouble() : null);
                        dayForecast.put("weatherDescription", getWeatherDescription(weatherCode != null ? weatherCode.get(i).asInt() : 0));
                        dayForecast.put("weatherIcon", getWeatherIcon(weatherCode != null ? weatherCode.get(i).asInt() : 0));
                        dayForecast.put("isToday", i == 0);

                        // Add hourly data for this day (24 hours per day)
                        List<Map<String, Object>> hourlyData = new ArrayList<>();
                        int startHour = i * 24;
                        int endHour = Math.min(startHour + 24, hourlyTime != null ? hourlyTime.size() : 0);

                        for (int h = startHour; h < endHour; h++) {
                            Map<String, Object> hourData = new HashMap<>();
                            String timeStr = hourlyTime.get(h).asText();
                            // Extract just the hour part (e.g., "14:00" from "2024-01-15T14:00")
                            hourData.put("time", timeStr.substring(11, 16));
                            hourData.put("hour", h - startHour);
                            hourData.put("temperature", hourlyTemp != null && !hourlyTemp.get(h).isNull() ? hourlyTemp.get(h).asDouble() : null);
                            hourData.put("humidity", hourlyHumidity != null && !hourlyHumidity.get(h).isNull() ? hourlyHumidity.get(h).asInt() : null);
                            hourData.put("precipitationProbability", hourlyPrecipProb != null && !hourlyPrecipProb.get(h).isNull() ? hourlyPrecipProb.get(h).asInt() : 0);
                            hourData.put("precipitation", hourlyPrecip != null && !hourlyPrecip.get(h).isNull() ? hourlyPrecip.get(h).asDouble() : 0);
                            hourData.put("windSpeed", hourlyWind != null && !hourlyWind.get(h).isNull() ? hourlyWind.get(h).asDouble() : null);
                            hourData.put("windDirection", hourlyWindDir != null && !hourlyWindDir.get(h).isNull() ? hourlyWindDir.get(h).asInt() : null);
                            hourData.put("directRadiation", hourlyDirectRad != null && !hourlyDirectRad.get(h).isNull() ? hourlyDirectRad.get(h).asDouble() : null);
                            hourData.put("apparentTemperature", hourlyApparent != null && !hourlyApparent.get(h).isNull() ? hourlyApparent.get(h).asDouble() : null);
                            hourData.put("uvIndex", hourlyUv != null && !hourlyUv.get(h).isNull() ? hourlyUv.get(h).asDouble() : null);
                            hourlyData.add(hourData);
                        }
                        dayForecast.put("hourlyData", hourlyData);

                        forecasts.add(dayForecast);
                    }

                    // Add current weather to today's forecast
                    if (!forecasts.isEmpty() && currentWeather != null) {
                        forecasts.get(0).put("currentTemp", currentWeather.get("temperature").asDouble());
                        forecasts.get(0).put("currentWindSpeed", currentWeather.get("windspeed").asDouble());
                        forecasts.get(0).put("currentWeatherCode", currentWeather.get("weathercode").asInt());
                        forecasts.get(0).put("currentWindDirection", currentWeather.has("winddirection") ? currentWeather.get("winddirection").asInt() : null);
                    }
                    
                    // Add current UV and radiation from current section
                    if (!forecasts.isEmpty() && current != null) {
                        forecasts.get(0).put("currentUvIndex", current.has("uv_index") && !current.get("uv_index").isNull() ? current.get("uv_index").asDouble() : null);
                        forecasts.get(0).put("currentSolarRadiation", current.has("direct_radiation") && !current.get("direct_radiation").isNull() ? current.get("direct_radiation").asDouble() : null);
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            // Return empty list on error
        }

        return forecasts;
    }

    /**
     * Get weather description from WMO weather code
     */
    private String getWeatherDescription(int code) {
        switch (code) {
            case 0: return "Despejado";
            case 1: return "Mayormente despejado";
            case 2: return "Parcialmente nublado";
            case 3: return "Nublado";
            case 45: return "Niebla";
            case 48: return "Niebla con escarcha";
            case 51: return "Llovizna ligera";
            case 53: return "Llovizna moderada";
            case 55: return "Llovizna densa";
            case 56: return "Llovizna helada ligera";
            case 57: return "Llovizna helada densa";
            case 61: return "Lluvia ligera";
            case 63: return "Lluvia moderada";
            case 65: return "Lluvia fuerte";
            case 66: return "Lluvia helada ligera";
            case 67: return "Lluvia helada fuerte";
            case 71: return "Nevada ligera";
            case 73: return "Nevada moderada";
            case 75: return "Nevada fuerte";
            case 77: return "Granizo";
            case 80: return "Chubascos ligeros";
            case 81: return "Chubascos moderados";
            case 82: return "Chubascos fuertes";
            case 85: return "Chubascos de nieve ligeros";
            case 86: return "Chubascos de nieve fuertes";
            case 95: return "Tormenta";
            case 96: return "Tormenta con granizo ligero";
            case 99: return "Tormenta con granizo fuerte";
            default: return "Desconocido";
        }
    }

    /**
     * Get weather icon emoji from WMO weather code
     */
    private String getWeatherIcon(int code) {
        switch (code) {
            case 0: return "sun";
            case 1: return "sun";
            case 2: return "cloud-sun";
            case 3: return "cloud";
            case 45:
            case 48: return "cloud-fog";
            case 51:
            case 53:
            case 55:
            case 56:
            case 57: return "cloud-drizzle";
            case 61:
            case 63:
            case 65:
            case 66:
            case 67: return "cloud-rain";
            case 71:
            case 73:
            case 75:
            case 77:
            case 85:
            case 86: return "cloud-snow";
            case 80:
            case 81:
            case 82: return "cloud-rain-wind";
            case 95:
            case 96:
            case 99: return "cloud-lightning";
            default: return "cloud";
        }
    }
}
