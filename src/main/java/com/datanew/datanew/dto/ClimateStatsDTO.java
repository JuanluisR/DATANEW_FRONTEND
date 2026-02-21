package com.datanew.datanew.dto;

import java.time.LocalDateTime;

public class ClimateStatsDTO {

    private String idEstacion;
    private LocalDateTime reportDate;

    // Temperatura
    private Float tempCurrent;
    private Float tempMax;
    private Float tempMin;

    // Humedad
    private Float humidityCurrent;
    private Float humidityMax;
    private Float humidityMin;

    // Presión
    private Float pressureCurrent;
    private Float pressureMax;
    private Float pressureMin;

    // Velocidad del Viento
    private Float windSpeedCurrent;
    private Float windSpeedMax;
    private Float windSpeedMin;

    // Punto de Rocío
    private Float dewpointCurrent;
    private Float dewpointMax;
    private Float dewpointMin;

    // Índice de Calor
    private Float heatIndexCurrent;
    private Float heatIndexMax;
    private Float heatIndexMin;

    // Sensación Térmica
    private Float windchillCurrent;
    private Float windchillMax;
    private Float windchillMin;

    // Precipitación
    private Float precipCurrent;
    private Float precipMax;
    private Float precipMin;

    // Radiación Solar
    private Float solarRadCurrent;
    private Float solarRadMax;
    private Float solarRadMin;

    // ETO
    private Float etoCurrent;
    private Float etoMax;
    private Float etoMin;

    // Dirección del Viento
    private Float windDegreesCurrent;
    private String windDirCurrent;

    // Ráfaga de Viento
    private Float windGustCurrent;
    private Float windGustMax;
    private Float windGustMin;

    // Constructors
    public ClimateStatsDTO() {}

    // Getters and Setters
    public String getIdEstacion() { return idEstacion; }
    public void setIdEstacion(String idEstacion) { this.idEstacion = idEstacion; }

    public LocalDateTime getReportDate() { return reportDate; }
    public void setReportDate(LocalDateTime reportDate) { this.reportDate = reportDate; }

    public Float getTempCurrent() { return tempCurrent; }
    public void setTempCurrent(Float tempCurrent) { this.tempCurrent = tempCurrent; }
    public Float getTempMax() { return tempMax; }
    public void setTempMax(Float tempMax) { this.tempMax = tempMax; }
    public Float getTempMin() { return tempMin; }
    public void setTempMin(Float tempMin) { this.tempMin = tempMin; }

    public Float getHumidityCurrent() { return humidityCurrent; }
    public void setHumidityCurrent(Float humidityCurrent) { this.humidityCurrent = humidityCurrent; }
    public Float getHumidityMax() { return humidityMax; }
    public void setHumidityMax(Float humidityMax) { this.humidityMax = humidityMax; }
    public Float getHumidityMin() { return humidityMin; }
    public void setHumidityMin(Float humidityMin) { this.humidityMin = humidityMin; }

    public Float getPressureCurrent() { return pressureCurrent; }
    public void setPressureCurrent(Float pressureCurrent) { this.pressureCurrent = pressureCurrent; }
    public Float getPressureMax() { return pressureMax; }
    public void setPressureMax(Float pressureMax) { this.pressureMax = pressureMax; }
    public Float getPressureMin() { return pressureMin; }
    public void setPressureMin(Float pressureMin) { this.pressureMin = pressureMin; }

    public Float getWindSpeedCurrent() { return windSpeedCurrent; }
    public void setWindSpeedCurrent(Float windSpeedCurrent) { this.windSpeedCurrent = windSpeedCurrent; }
    public Float getWindSpeedMax() { return windSpeedMax; }
    public void setWindSpeedMax(Float windSpeedMax) { this.windSpeedMax = windSpeedMax; }
    public Float getWindSpeedMin() { return windSpeedMin; }
    public void setWindSpeedMin(Float windSpeedMin) { this.windSpeedMin = windSpeedMin; }

    public Float getDewpointCurrent() { return dewpointCurrent; }
    public void setDewpointCurrent(Float dewpointCurrent) { this.dewpointCurrent = dewpointCurrent; }
    public Float getDewpointMax() { return dewpointMax; }
    public void setDewpointMax(Float dewpointMax) { this.dewpointMax = dewpointMax; }
    public Float getDewpointMin() { return dewpointMin; }
    public void setDewpointMin(Float dewpointMin) { this.dewpointMin = dewpointMin; }

    public Float getHeatIndexCurrent() { return heatIndexCurrent; }
    public void setHeatIndexCurrent(Float heatIndexCurrent) { this.heatIndexCurrent = heatIndexCurrent; }
    public Float getHeatIndexMax() { return heatIndexMax; }
    public void setHeatIndexMax(Float heatIndexMax) { this.heatIndexMax = heatIndexMax; }
    public Float getHeatIndexMin() { return heatIndexMin; }
    public void setHeatIndexMin(Float heatIndexMin) { this.heatIndexMin = heatIndexMin; }

    public Float getWindchillCurrent() { return windchillCurrent; }
    public void setWindchillCurrent(Float windchillCurrent) { this.windchillCurrent = windchillCurrent; }
    public Float getWindchillMax() { return windchillMax; }
    public void setWindchillMax(Float windchillMax) { this.windchillMax = windchillMax; }
    public Float getWindchillMin() { return windchillMin; }
    public void setWindchillMin(Float windchillMin) { this.windchillMin = windchillMin; }

    public Float getPrecipCurrent() { return precipCurrent; }
    public void setPrecipCurrent(Float precipCurrent) { this.precipCurrent = precipCurrent; }
    public Float getPrecipMax() { return precipMax; }
    public void setPrecipMax(Float precipMax) { this.precipMax = precipMax; }
    public Float getPrecipMin() { return precipMin; }
    public void setPrecipMin(Float precipMin) { this.precipMin = precipMin; }

    public Float getSolarRadCurrent() { return solarRadCurrent; }
    public void setSolarRadCurrent(Float solarRadCurrent) { this.solarRadCurrent = solarRadCurrent; }
    public Float getSolarRadMax() { return solarRadMax; }
    public void setSolarRadMax(Float solarRadMax) { this.solarRadMax = solarRadMax; }
    public Float getSolarRadMin() { return solarRadMin; }
    public void setSolarRadMin(Float solarRadMin) { this.solarRadMin = solarRadMin; }

    public Float getEtoCurrent() { return etoCurrent; }
    public void setEtoCurrent(Float etoCurrent) { this.etoCurrent = etoCurrent; }
    public Float getEtoMax() { return etoMax; }
    public void setEtoMax(Float etoMax) { this.etoMax = etoMax; }
    public Float getEtoMin() { return etoMin; }
    public void setEtoMin(Float etoMin) { this.etoMin = etoMin; }

    public Float getWindDegreesCurrent() { return windDegreesCurrent; }
    public void setWindDegreesCurrent(Float windDegreesCurrent) { this.windDegreesCurrent = windDegreesCurrent; }
    public String getWindDirCurrent() { return windDirCurrent; }
    public void setWindDirCurrent(String windDirCurrent) { this.windDirCurrent = windDirCurrent; }

    public Float getWindGustCurrent() { return windGustCurrent; }
    public void setWindGustCurrent(Float windGustCurrent) { this.windGustCurrent = windGustCurrent; }
    public Float getWindGustMax() { return windGustMax; }
    public void setWindGustMax(Float windGustMax) { this.windGustMax = windGustMax; }
    public Float getWindGustMin() { return windGustMin; }
    public void setWindGustMin(Float windGustMin) { this.windGustMin = windGustMin; }
}
