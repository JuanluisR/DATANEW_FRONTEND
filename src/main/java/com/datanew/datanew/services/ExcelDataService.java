package com.datanew.datanew.services;

import com.datanew.datanew.models.entities.DataStation;
import com.datanew.datanew.repositories.DataStationRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ExcelDataService {

    private static final Logger logger = LoggerFactory.getLogger(ExcelDataService.class);

    @Autowired
    private DataStationRepository dataStationRepository;

    @Autowired
    private AlertNotificationService alertNotificationService;

    private static final DateTimeFormatter[] DATE_FORMATTERS = {
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"),
        DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"),
        DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"),
        DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss"),
        DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss")
    };

    @Transactional
    public Map<String, Object> processExcelFile(MultipartFile file) {
        Map<String, Object> response = new HashMap<>();
        List<String> errors = new ArrayList<>();
        List<DataStation> savedData = new ArrayList<>();

        String filename = file.getOriginalFilename();
        boolean isCsv = filename != null && filename.toLowerCase().endsWith(".csv");

        if (isCsv) {
            return processCsvFile(file);
        }

        try (InputStream inputStream = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(inputStream)) {

            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null) {
                response.put("success", false);
                response.put("message", "No se encontró la hoja de cálculo");
                return response;
            }

            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                response.put("success", false);
                response.put("message", "El archivo no tiene encabezado");
                return response;
            }

            Map<Integer, String> columnMapping = getColumnMapping(headerRow);
            if (!columnMapping.containsValue("id_estacion")) {
                errors.add("Falta la columna 'id_estacion' requerida");
            }
            if (!columnMapping.containsValue("wswdat_report_date")) {
                errors.add("Falta la columna 'wswdat_report_date' requerida");
            }

            if (!errors.isEmpty()) {
                response.put("success", false);
                response.put("errors", errors);
                return response;
            }

            int rowCount = 0;
            int successCount = 0;
            int errorCount = 0;

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row)) {
                    continue;
                }

                rowCount++;
                try {
                    DataStation dataStation = mapRowToDataStation(row, columnMapping);
                    DataStation saved = dataStationRepository.save(dataStation);
                    savedData.add(saved);
                    successCount++;

                    try {
                        alertNotificationService.checkAlerts(saved);
                    } catch (Exception e) {
                        logger.warn("Error verificando alertas para fila {}: {}", i, e.getMessage());
                    }

                } catch (Exception e) {
                    errorCount++;
                    String errorMsg = "Fila " + (i + 1) + ": " + e.getMessage();
                    errors.add(errorMsg);
                    logger.error("Error procesando fila {}: {}", i, e.getMessage());
                }
            }

            response.put("success", true);
            response.put("totalRows", rowCount);
            response.put("successCount", successCount);
            response.put("errorCount", errorCount);
            response.put("savedRecords", savedData.size());
            if (!errors.isEmpty()) {
                response.put("errors", errors);
            }

        } catch (IOException e) {
            logger.error("Error leyendo archivo Excel: {}", e.getMessage());
            response.put("success", false);
            response.put("message", "Error al leer el archivo: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Error procesando archivo Excel: {}", e.getMessage());
            response.put("success", false);
            response.put("message", "Error al procesar el archivo: " + e.getMessage());
        }

        return response;
    }

    private Map<Integer, String> getColumnMapping(Row headerRow) {
        Map<Integer, String> mapping = new HashMap<>();
        
        for (int i = 0; i < headerRow.getLastCellNum(); i++) {
            Cell cell = headerRow.getCell(i);
            if (cell != null) {
                String headerName = getCellValueAsString(cell).trim().toLowerCase();
                mapping.put(i, headerName);
            }
        }
        return mapping;
    }

    private DataStation mapRowToDataStation(Row row, Map<Integer, String> columnMapping) {
        DataStation dataStation = new DataStation();

        for (Map.Entry<Integer, String> entry : columnMapping.entrySet()) {
            int colIndex = entry.getKey();
            String columnName = entry.getValue();
            Cell cell = row.getCell(colIndex);

            switch (columnName) {
                case "id_estacion":
                    dataStation.setId_estacion(getCellValueAsString(cell));
                    break;
                case "wswdat_report_date":
                    dataStation.setWswdat_report_date(parseDateTime(getCellValueAsString(cell)));
                    break;
                case "wswdat_temp_c":
                    dataStation.setWswdat_temp_c(getCellValueAsFloat(cell));
                    break;
                case "wswdat_temp_f":
                    dataStation.setWswdat_temp_f(getCellValueAsFloat(cell));
                    break;
                case "wswdat_relative_humidity":
                    dataStation.setWswdat_relative_humidity(getCellValueAsFloat(cell));
                    break;
                case "wswdat_dewpoint_c":
                    dataStation.setWswdat_dewpoint_c(getCellValueAsFloat(cell));
                    break;
                case "wswdat_dewpoint_f":
                    dataStation.setWswdat_dewpoint_f(getCellValueAsFloat(cell));
                    break;
                case "wswdat_pressure_rel_hpa":
                    dataStation.setWswdat_pressure_rel_hpa(getCellValueAsFloat(cell));
                    break;
                case "wswdat_pressure_rel_mb":
                    dataStation.setWswdat_pressure_rel_mb(getCellValueAsFloat(cell));
                    break;
                case "wswdat_pressure_rel_inhg":
                    dataStation.setWswdat_pressure_rel_inhg(getCellValueAsFloat(cell));
                    break;
                case "wswdat_pressure_abs_hpa":
                    dataStation.setWswdat_pressure_abs_hpa(getCellValueAsFloat(cell));
                    break;
                case "wswdat_pressure_abs_mb":
                    dataStation.setWswdat_pressure_abs_mb(getCellValueAsFloat(cell));
                    break;
                case "wswdat_pressure_abs_inhg":
                    dataStation.setWswdat_pressure_abs_inhg(getCellValueAsFloat(cell));
                    break;
                case "wswdat_precip_rate_mmh":
                    dataStation.setWswdat_precip_rate_mmh(getCellValueAsFloat(cell));
                    break;
                case "wswdat_precip_rate_inh":
                    dataStation.setWswdat_precip_rate_inh(getCellValueAsFloat(cell));
                    break;
                case "wswdat_precip_today_mm":
                    dataStation.setWswdat_precip_today_mm(getCellValueAsFloat(cell));
                    break;
                case "wswdat_precip_today_in":
                    dataStation.setWswdat_precip_today_in(getCellValueAsFloat(cell));
                    break;
                case "wswdat_wind_degrees":
                    dataStation.setWswdat_wind_degrees(getCellValueAsFloat(cell));
                    break;
                case "wswdat_wind_dir":
                    dataStation.setWswdat_wind_dir(getCellValueAsString(cell));
                    break;
                case "wswdat_wind_speed_kmh":
                    dataStation.setWswdat_wind_speed_kmh(getCellValueAsFloat(cell));
                    break;
                case "wswdat_wind_speed_mph":
                    dataStation.setWswdat_wind_speed_mph(getCellValueAsFloat(cell));
                    break;
                case "wswdat_wind_speed_ms":
                    dataStation.setWswdat_wind_speed_ms(getCellValueAsFloat(cell));
                    break;
                case "wswdat_windchill_c":
                    dataStation.setWswdat_windchill_c(getCellValueAsFloat(cell));
                    break;
                case "wswdat_windchill_f":
                    dataStation.setWswdat_windchill_f(getCellValueAsFloat(cell));
                    break;
                case "wswdat_heat_index_c":
                    dataStation.setWswdat_heat_index_c(getCellValueAsFloat(cell));
                    break;
                case "wswdat_heat_index_f":
                    dataStation.setWswdat_heat_index_f(getCellValueAsFloat(cell));
                    break;
                case "wswdat_solar_rad_wm2":
                    dataStation.setWswdat_solar_rad_wm2(getCellValueAsFloat(cell));
                    break;
                case "wswdat_illuminance_lux":
                    dataStation.setWswdat_illuminance_lux(getCellValueAsFloat(cell));
                    break;
                case "wswdat_uv_index":
                    dataStation.setWswdat_uv_index(getCellValueAsFloat(cell));
                    break;
                case "wswdat_eto_mm":
                    dataStation.setWswdat_eto_mm(getCellValueAsFloat(cell));
                    break;
                case "wswdat_wind_gust_kmh":
                    dataStation.setWswdat_wind_gust_kmh(getCellValueAsFloat(cell));
                    break;
                case "wswdat_wind_gust_mph":
                    dataStation.setWswdat_wind_gust_mph(getCellValueAsFloat(cell));
                    break;
                case "wswdat_wind_gust_ms":
                    dataStation.setWswdat_wind_gust_ms(getCellValueAsFloat(cell));
                    break;
                case "wswdat_realfeel_c":
                    dataStation.setWswdat_realfeel_c(getCellValueAsFloat(cell));
                    break;
                case "wswdat_realfeel_f":
                    dataStation.setWswdat_realfeel_f(getCellValueAsFloat(cell));
                    break;
            }
        }

        return dataStation;
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) {
            return "";
        }
        
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getLocalDateTimeCellValue().toString();
                }
                return String.valueOf(cell.getNumericCellValue());
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                try {
                    return cell.getStringCellValue();
                } catch (Exception e) {
                    return String.valueOf(cell.getNumericCellValue());
                }
            default:
                return "";
        }
    }

    private Float getCellValueAsFloat(Cell cell) {
        if (cell == null) {
            return null;
        }
        
        try {
            switch (cell.getCellType()) {
                case NUMERIC:
                    return (float) cell.getNumericCellValue();
                case STRING:
                    String value = cell.getStringCellValue().trim();
                    if (value.isEmpty()) {
                        return null;
                    }
                    return Float.parseFloat(value);
                case FORMULA:
                    return (float) cell.getNumericCellValue();
                default:
                    return null;
            }
        } catch (Exception e) {
            return null;
        }
    }

    private LocalDateTime parseDateTime(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null;
        }

        String trimmed = dateStr.trim();
        
        for (DateTimeFormatter formatter : DATE_FORMATTERS) {
            try {
                return LocalDateTime.parse(trimmed, formatter);
            } catch (Exception e) {
                // Try next formatter
            }
        }
        
        // Try parsing as date only
        try {
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            return java.time.LocalDate.parse(trimmed, dateFormatter).atStartOfDay();
        } catch (Exception e) {
            logger.warn("No se pudo parsear la fecha: {}", dateStr);
            return null;
        }
    }

    private boolean isRowEmpty(Row row) {
        if (row == null) {
            return true;
        }
        for (int i = 0; i < row.getLastCellNum(); i++) {
            Cell cell = row.getCell(i);
            if (cell != null && !getCellValueAsString(cell).isEmpty()) {
                return false;
            }
        }
        return true;
    }

    public Map<String, Object> getTemplateColumns() {
        Map<String, Object> template = new HashMap<>();
        
        List<String> required = new ArrayList<>();
        required.add("id_estacion");
        required.add("wswdat_report_date");
        
        List<String> optional = new ArrayList<>();
        optional.add("wswdat_temp_c");
        optional.add("wswdat_temp_f");
        optional.add("wswdat_relative_humidity");
        optional.add("wswdat_dewpoint_c");
        optional.add("wswdat_dewpoint_f");
        optional.add("wswdat_pressure_rel_hpa");
        optional.add("wswdat_pressure_rel_mb");
        optional.add("wswdat_pressure_rel_inhg");
        optional.add("wswdat_pressure_abs_hpa");
        optional.add("wswdat_pressure_abs_mb");
        optional.add("wswdat_pressure_abs_inhg");
        optional.add("wswdat_precip_rate_mmh");
        optional.add("wswdat_precip_rate_inh");
        optional.add("wswdat_precip_today_mm");
        optional.add("wswdat_precip_today_in");
        optional.add("wswdat_wind_degrees");
        optional.add("wswdat_wind_dir");
        optional.add("wswdat_wind_speed_kmh");
        optional.add("wswdat_wind_speed_mph");
        optional.add("wswdat_wind_speed_ms");
        optional.add("wswdat_windchill_c");
        optional.add("wswdat_windchill_f");
        optional.add("wswdat_heat_index_c");
        optional.add("wswdat_heat_index_f");
        optional.add("wswdat_solar_rad_wm2");
        optional.add("wswdat_illuminance_lux");
        optional.add("wswdat_uv_index");
        optional.add("wswdat_eto_mm");
        optional.add("wswdat_wind_gust_kmh");
        optional.add("wswdat_wind_gust_mph");
        optional.add("wswdat_wind_gust_ms");
        optional.add("wswdat_realfeel_c");
        optional.add("wswdat_realfeel_f");
        
        template.put("required", required);
        template.put("optional", optional);
        template.put("dateFormats", List.of(
            "yyyy-MM-dd HH:mm:ss",
            "yyyy-MM-dd'T'HH:mm:ss",
            "yyyy-MM-dd HH:mm",
            "dd/MM/yyyy HH:mm:ss",
            "dd/MM/yyyy HH:mm",
            "dd-MM-yyyy HH:mm:ss",
            "yyyy/MM/dd HH:mm:ss"
        ));
        
        return template;
    }

    private Map<String, Object> processCsvFile(MultipartFile file) {
        Map<String, Object> response = new HashMap<>();
        List<String> errors = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String headerLine = reader.readLine();
            if (headerLine == null || headerLine.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "El archivo CSV está vacío");
                return response;
            }

            String[] headers = parseCsvLine(headerLine);
            Map<Integer, String> columnMapping = new HashMap<>();
            for (int i = 0; i < headers.length; i++) {
                columnMapping.put(i, headers[i].trim().toLowerCase());
            }

            if (!columnMapping.containsValue("id_estacion")) {
                errors.add("Falta la columna 'id_estacion' requerida");
            }
            if (!columnMapping.containsValue("wswdat_report_date")) {
                errors.add("Falta la columna 'wswdat_report_date' requerida");
            }

            if (!errors.isEmpty()) {
                response.put("success", false);
                response.put("errors", errors);
                return response;
            }

            String line;
            int rowCount = 0;
            int successCount = 0;
            int errorCount = 0;

            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) continue;

                rowCount++;
                try {
                    String[] values = parseCsvLine(line);
                    DataStation dataStation = mapCsvToDataStation(values, columnMapping);
                    DataStation saved = dataStationRepository.save(dataStation);

                    try {
                        alertNotificationService.checkAlerts(saved);
                    } catch (Exception e) {
                        logger.warn("Error verificando alertas para fila {}: {}", rowCount, e.getMessage());
                    }
                    successCount++;
                } catch (Exception e) {
                    errorCount++;
                    String errorMsg = "Fila " + (rowCount + 1) + ": " + e.getMessage();
                    errors.add(errorMsg);
                    logger.error("Error procesando fila {}: {}", rowCount, e.getMessage());
                }
            }

            response.put("success", true);
            response.put("totalRows", rowCount);
            response.put("successCount", successCount);
            response.put("errorCount", errorCount);
            if (!errors.isEmpty()) {
                response.put("errors", errors);
            }

        } catch (IOException e) {
            logger.error("Error leyendo archivo CSV: {}", e.getMessage());
            response.put("success", false);
            response.put("message", "Error al leer el archivo: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Error procesando archivo CSV: {}", e.getMessage());
            response.put("success", false);
            response.put("message", "Error al procesar el archivo: " + e.getMessage());
        }

        return response;
    }

    private String[] parseCsvLine(String line) {
        List<String> values = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                values.add(sb.toString());
                sb = new StringBuilder();
            } else {
                sb.append(c);
            }
        }
        values.add(sb.toString());
        return values.toArray(new String[0]);
    }

    private DataStation mapCsvToDataStation(String[] values, Map<Integer, String> columnMapping) {
        DataStation dataStation = new DataStation();

        for (Map.Entry<Integer, String> entry : columnMapping.entrySet()) {
            int colIndex = entry.getKey();
            String columnName = entry.getValue();

            if (colIndex >= values.length) continue;
            String value = values[colIndex].trim();

            switch (columnName) {
                case "id_estacion":
                    dataStation.setId_estacion(value);
                    break;
                case "wswdat_report_date":
                    dataStation.setWswdat_report_date(parseDateTime(value));
                    break;
                case "wswdat_temp_c":
                    dataStation.setWswdat_temp_c(parseFloat(value));
                    break;
                case "wswdat_temp_f":
                    dataStation.setWswdat_temp_f(parseFloat(value));
                    break;
                case "wswdat_relative_humidity":
                    dataStation.setWswdat_relative_humidity(parseFloat(value));
                    break;
                case "wswdat_dewpoint_c":
                    dataStation.setWswdat_dewpoint_c(parseFloat(value));
                    break;
                case "wswdat_dewpoint_f":
                    dataStation.setWswdat_dewpoint_f(parseFloat(value));
                    break;
                case "wswdat_pressure_rel_hpa":
                    dataStation.setWswdat_pressure_rel_hpa(parseFloat(value));
                    break;
                case "wswdat_pressure_rel_mb":
                    dataStation.setWswdat_pressure_rel_mb(parseFloat(value));
                    break;
                case "wswdat_pressure_rel_inhg":
                    dataStation.setWswdat_pressure_rel_inhg(parseFloat(value));
                    break;
                case "wswdat_pressure_abs_hpa":
                    dataStation.setWswdat_pressure_abs_hpa(parseFloat(value));
                    break;
                case "wswdat_pressure_abs_mb":
                    dataStation.setWswdat_pressure_abs_mb(parseFloat(value));
                    break;
                case "wswdat_pressure_abs_inhg":
                    dataStation.setWswdat_pressure_abs_inhg(parseFloat(value));
                    break;
                case "wswdat_precip_rate_mmh":
                    dataStation.setWswdat_precip_rate_mmh(parseFloat(value));
                    break;
                case "wswdat_precip_rate_inh":
                    dataStation.setWswdat_precip_rate_inh(parseFloat(value));
                    break;
                case "wswdat_precip_today_mm":
                    dataStation.setWswdat_precip_today_mm(parseFloat(value));
                    break;
                case "wswdat_precip_today_in":
                    dataStation.setWswdat_precip_today_in(parseFloat(value));
                    break;
                case "wswdat_wind_degrees":
                    dataStation.setWswdat_wind_degrees(parseFloat(value));
                    break;
                case "wswdat_wind_dir":
                    dataStation.setWswdat_wind_dir(value);
                    break;
                case "wswdat_wind_speed_kmh":
                    dataStation.setWswdat_wind_speed_kmh(parseFloat(value));
                    break;
                case "wswdat_wind_speed_mph":
                    dataStation.setWswdat_wind_speed_mph(parseFloat(value));
                    break;
                case "wswdat_wind_speed_ms":
                    dataStation.setWswdat_wind_speed_ms(parseFloat(value));
                    break;
                case "wswdat_windchill_c":
                    dataStation.setWswdat_windchill_c(parseFloat(value));
                    break;
                case "wswdat_windchill_f":
                    dataStation.setWswdat_windchill_f(parseFloat(value));
                    break;
                case "wswdat_heat_index_c":
                    dataStation.setWswdat_heat_index_c(parseFloat(value));
                    break;
                case "wswdat_heat_index_f":
                    dataStation.setWswdat_heat_index_f(parseFloat(value));
                    break;
                case "wswdat_solar_rad_wm2":
                    dataStation.setWswdat_solar_rad_wm2(parseFloat(value));
                    break;
                case "wswdat_illuminance_lux":
                    dataStation.setWswdat_illuminance_lux(parseFloat(value));
                    break;
                case "wswdat_uv_index":
                    dataStation.setWswdat_uv_index(parseFloat(value));
                    break;
                case "wswdat_eto_mm":
                    dataStation.setWswdat_eto_mm(parseFloat(value));
                    break;
                case "wswdat_wind_gust_kmh":
                    dataStation.setWswdat_wind_gust_kmh(parseFloat(value));
                    break;
                case "wswdat_wind_gust_mph":
                    dataStation.setWswdat_wind_gust_mph(parseFloat(value));
                    break;
                case "wswdat_wind_gust_ms":
                    dataStation.setWswdat_wind_gust_ms(parseFloat(value));
                    break;
                case "wswdat_realfeel_c":
                    dataStation.setWswdat_realfeel_c(parseFloat(value));
                    break;
                case "wswdat_realfeel_f":
                    dataStation.setWswdat_realfeel_f(parseFloat(value));
                    break;
            }
        }

        return dataStation;
    }

    private Float parseFloat(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            return Float.parseFloat(value.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
