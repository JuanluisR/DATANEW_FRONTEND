package com.datanew.datanew.services;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.datanew.datanew.dto.ClimateStatsDTO;
import com.datanew.datanew.models.entities.DataStation;
import com.datanew.datanew.repositories.DataStationRepository;

@Service
public class DataStationServiceImpl implements DataStationService{

    private static final Logger log = LoggerFactory.getLogger(DataStationServiceImpl.class);

    @Autowired
    private DataStationRepository dataStationRepository;

    @Autowired
    private ApiKeyService apiKeyService;


    @Override
@Transactional(readOnly = true)
    public List<DataStation> findAll() {
       return (List<DataStation>) dataStationRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<DataStation> findById(Long id) {
       return dataStationRepository.findById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<DataStation> findLatestByIdEstacion(String idEstacion) {
       return dataStationRepository.findLatestByIdEstacion(idEstacion);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ClimateStatsDTO> getClimateStats(String idEstacion) {
        // Obtener el último registro (actual)
        Optional<DataStation> latestOpt = dataStationRepository.findLatestByIdEstacion(idEstacion);
        if (latestOpt.isEmpty()) {
            return Optional.empty();
        }

        DataStation latest = latestOpt.get();

        // Obtener todos los registros del mismo día para calcular max/min
        java.time.LocalDateTime reportDateTime = latest.getWswdat_report_date();
        java.time.LocalDateTime startOfDay = reportDateTime.toLocalDate().atStartOfDay();
        java.time.LocalDateTime endOfDay = startOfDay.plusDays(1);

        List<DataStation> dayRecords = dataStationRepository.findByIdEstacionAndDateRange(idEstacion, startOfDay, endOfDay);

        // Si no hay registros del día, usar todos los registros disponibles
        if (dayRecords.isEmpty()) {
            dayRecords = dataStationRepository.findAllByIdEstacion(idEstacion);
        }

        ClimateStatsDTO stats = new ClimateStatsDTO();
        stats.setIdEstacion(idEstacion);
        stats.setReportDate(latest.getWswdat_report_date());

        // Temperatura
        stats.setTempCurrent(latest.getWswdat_temp_c());
        setMinMaxFloat(dayRecords.stream().map(DataStation::getWswdat_temp_c).collect(Collectors.toList()),
            val -> stats.setTempMax(val), val -> stats.setTempMin(val));

        // Humedad
        stats.setHumidityCurrent(latest.getWswdat_relative_humidity());
        setMinMaxFloat(dayRecords.stream().map(DataStation::getWswdat_relative_humidity).collect(Collectors.toList()),
            val -> stats.setHumidityMax(val), val -> stats.setHumidityMin(val));

        // Presión
        stats.setPressureCurrent(latest.getWswdat_pressure_rel_hpa());
        setMinMaxFloat(dayRecords.stream().map(DataStation::getWswdat_pressure_rel_hpa).collect(Collectors.toList()),
            val -> stats.setPressureMax(val), val -> stats.setPressureMin(val));

        // Velocidad del Viento
        stats.setWindSpeedCurrent(latest.getWswdat_wind_speed_kmh());
        setMinMaxFloat(dayRecords.stream().map(DataStation::getWswdat_wind_speed_kmh).collect(Collectors.toList()),
            val -> stats.setWindSpeedMax(val), val -> stats.setWindSpeedMin(val));

        // Punto de Rocío
        stats.setDewpointCurrent(latest.getWswdat_dewpoint_c());
        setMinMaxFloat(dayRecords.stream().map(DataStation::getWswdat_dewpoint_c).collect(Collectors.toList()),
            val -> stats.setDewpointMax(val), val -> stats.setDewpointMin(val));

        // Índice de Calor
        stats.setHeatIndexCurrent(latest.getWswdat_heat_index_c());
        setMinMaxFloat(dayRecords.stream().map(DataStation::getWswdat_heat_index_c).collect(Collectors.toList()),
            val -> stats.setHeatIndexMax(val), val -> stats.setHeatIndexMin(val));

        // Sensación Térmica
        stats.setWindchillCurrent(latest.getWswdat_windchill_c());
        setMinMaxFloat(dayRecords.stream().map(DataStation::getWswdat_windchill_c).collect(Collectors.toList()),
            val -> stats.setWindchillMax(val), val -> stats.setWindchillMin(val));

        // Precipitación
        stats.setPrecipCurrent(latest.getWswdat_precip_today_mm());
        setMinMaxFloat(dayRecords.stream().map(DataStation::getWswdat_precip_today_mm).collect(Collectors.toList()),
            val -> stats.setPrecipMax(val), val -> stats.setPrecipMin(val));

        // Radiación Solar
        stats.setSolarRadCurrent(latest.getWswdat_solar_rad_wm2());
        setMinMaxFloat(dayRecords.stream().map(DataStation::getWswdat_solar_rad_wm2).collect(Collectors.toList()),
            val -> stats.setSolarRadMax(val), val -> stats.setSolarRadMin(val));

        // ETO
        stats.setEtoCurrent(latest.getWswdat_eto_mm());
        setMinMaxFloat(dayRecords.stream().map(DataStation::getWswdat_eto_mm).collect(Collectors.toList()),
            val -> stats.setEtoMax(val), val -> stats.setEtoMin(val));

        // Dirección del Viento
        stats.setWindDegreesCurrent(latest.getWswdat_wind_degrees());
        stats.setWindDirCurrent(latest.getWswdat_wind_dir());

        // Ráfaga de Viento
        stats.setWindGustCurrent(latest.getWswdat_wind_gust_kmh());
        setMinMaxFloat(dayRecords.stream().map(DataStation::getWswdat_wind_gust_kmh).collect(Collectors.toList()),
            val -> stats.setWindGustMax(val), val -> stats.setWindGustMin(val));

        return Optional.of(stats);
    }

    private void setMinMaxFloat(List<Float> values, java.util.function.Consumer<Float> setMax, java.util.function.Consumer<Float> setMin) {
        List<Float> validValues = values.stream()
            .filter(v -> v != null && !v.isNaN())
            .collect(Collectors.toList());

        if (!validValues.isEmpty()) {
            float max = validValues.stream().max(Float::compareTo).orElse(0f);
            float min = validValues.stream().min(Float::compareTo).orElse(0f);
            setMax.accept(max);
            setMin.accept(min);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<DataStation> findByDateRange(String idEstacion, java.time.LocalDateTime startDate, java.time.LocalDateTime endDate) {
        return dataStationRepository.findByIdEstacionAndDateRangeAsc(idEstacion, startDate, endDate);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DataStation> findByDateRangeString(String idEstacion, String startDate, String endDate) {
        try {
            String decodedStartDate = java.net.URLDecoder.decode(startDate, "UTF-8");
            String decodedEndDate = java.net.URLDecoder.decode(endDate, "UTF-8");
            
            return parseAndFindByDateRange(idEstacion, decodedStartDate, decodedEndDate);
        } catch (Exception e) {
            log.warn("URL decoding failed for date range, trying raw values: {}", e.getMessage());
            try {
                return parseAndFindByDateRange(idEstacion, startDate, endDate);
            } catch (Exception ex) {
                throw new RuntimeException("Formato de fecha inválido. Use: yyyy-MM-dd HH:mm:ss o yyyy-MM-dd'T'HH:mm:ss");
            }
        }
    }
    
    private List<DataStation> parseAndFindByDateRange(String idEstacion, String startDate, String endDate) {
        DateTimeFormatter[] formatters = {
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd")
        };
        
        LocalDateTime start = parseDateTime(startDate, formatters);
        LocalDateTime end = parseDateTime(endDate, formatters);
        
        return dataStationRepository.findByIdEstacionAndDateRangeAsc(idEstacion, start, end);
    }
    
    private LocalDateTime parseDateTime(String dateStr, DateTimeFormatter[] formatters) {
        for (DateTimeFormatter formatter : formatters) {
            try {
                return LocalDateTime.parse(dateStr, formatter);
            } catch (Exception e) {
                // Try next formatter
            }
        }
        throw new RuntimeException("No se pudo parsear la fecha: " + dateStr);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean validateApiKeyForStation(String apiKey, String idEstacion) {
        Optional<com.datanew.datanew.models.entities.ApiKey> apiKeyOpt = apiKeyService.validateApiKey(apiKey);
        if (apiKeyOpt.isPresent()) {
            return apiKeyOpt.get().getIdEstacion().equals(idEstacion);
        }
        return false;
    }

    @Override
    @Transactional
    public DataStation save(DataStation dataStation) {
     return dataStationRepository.save(dataStation);
    }

    @Override
    @Transactional
    public Optional<DataStation> update(DataStation dataStation, Long id) {
       Optional<DataStation> o = findById(id);
       if (o.isPresent()) {
        DataStation dataDb = o.orElseThrow();
        dataDb.setId_estacion(dataStation.getId_estacion());
        dataDb.setWswdat_dewpoint_c(dataStation.getWswdat_dewpoint_c());
        dataDb.setWswdat_dewpoint_f(dataStation.getWswdat_dewpoint_f());
        dataDb.setWswdat_eto_mm(dataStation.getWswdat_eto_mm());
        dataDb.setWswdat_heat_index_c(dataStation.getWswdat_heat_index_c());
        dataDb.setWswdat_heat_index_f(dataStation.getWswdat_heat_index_f());
        dataDb.setWswdat_illuminance_lux(dataStation.getWswdat_illuminance_lux());
        dataDb.setWswdat_precip_rate_inh(dataStation.getWswdat_precip_rate_inh());
        dataDb.setWswdat_precip_rate_mmh(dataStation.getWswdat_precip_rate_mmh());
        dataDb.setWswdat_precip_today_in(dataStation.getWswdat_precip_today_in());
        dataDb.setWswdat_precip_today_mm(dataStation.getWswdat_precip_today_mm());
        dataDb.setWswdat_pressure_abs_hpa(dataStation.getWswdat_pressure_abs_hpa());
        dataDb.setWswdat_pressure_abs_inhg(dataStation.getWswdat_pressure_abs_inhg());
        dataDb.setWswdat_pressure_abs_mb(dataStation.getWswdat_pressure_abs_mb());
        dataDb.setWswdat_pressure_rel_hpa(dataStation.getWswdat_pressure_rel_hpa());
        dataDb.setWswdat_pressure_rel_inhg(dataStation.getWswdat_pressure_rel_inhg());
        dataDb.setWswdat_pressure_rel_mb(dataStation.getWswdat_pressure_rel_mb());
        dataDb.setWswdat_realfeel_c(dataStation.getWswdat_realfeel_c());
        dataDb.setWswdat_realfeel_f(dataStation.getWswdat_realfeel_f());
        dataDb.setWswdat_relative_humidity(dataStation.getWswdat_relative_humidity());
        dataDb.setWswdat_report_date(dataStation.getWswdat_report_date());
        dataDb.setWswdat_solar_rad_wm2(dataStation.getWswdat_solar_rad_wm2());
        dataDb.setWswdat_temp_c(dataStation.getWswdat_temp_c());
        dataDb.setWswdat_temp_f(dataStation.getWswdat_temp_f());
        dataDb.setWswdat_uv_index(dataStation.getWswdat_uv_index());
        dataDb.setWswdat_wind_degrees(dataStation.getWswdat_wind_degrees());
        dataDb.setWswdat_wind_dir(dataStation.getWswdat_wind_dir());
        dataDb.setWswdat_wind_gust_kmh(dataStation.getWswdat_wind_gust_kmh());
        dataDb.setWswdat_wind_gust_mph(dataStation.getWswdat_wind_gust_mph());
        dataDb.setWswdat_wind_gust_ms(dataStation.getWswdat_wind_gust_ms());
        dataDb.setWswdat_wind_speed_kmh(dataStation.getWswdat_wind_speed_kmh());
        dataDb.setWswdat_wind_speed_mph(dataStation.getWswdat_wind_speed_mph());
        dataDb.setWswdat_wind_speed_ms(dataStation.getWswdat_wind_speed_ms());
        dataDb.setWswdat_windchill_c(dataStation.getWswdat_windchill_c());
        dataDb.setWswdat_windchill_f(dataStation.getWswdat_windchill_f());
    
        return Optional.of(save(dataDb));
       }
       return Optional.empty();
    }

    @Override
    @Transactional
    public void remove(Long id) {
        dataStationRepository.deleteById(id);
    }



   

}
