package com.datanew.datanew.models.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;


@Entity
@Table(name = "ws_climate_data", indexes = {
    @Index(name = "idx_datastation_station", columnList = "id_estacion")
})
public class DataStation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long data_id;

    @NotBlank(message = "Station ID is required")
    @Column(name = "id_estacion")
    private String id_estacion;
@Column(name = "wswdat_temp_c")
private Float wswdat_temp_c;
@Column(name = "wswdat_temp_f")
private Float wswdat_temp_f;
@Column(name = "wswdat_relative_humidity")
private Float wswdat_relative_humidity;
@Column(name = "wswdat_dewpoint_c")
private Float wswdat_dewpoint_c;
@Column(name = "wswdat_dewpoint_f")
private Float wswdat_dewpoint_f;
@Column(name = "wswdat_pressure_rel_hpa")
private Float wswdat_pressure_rel_hpa;
@Column(name = "wswdat_pressure_rel_mb")
private Float wswdat_pressure_rel_mb;
@Column(name = "wswdat_pressure_rel_inhg")
private Float wswdat_pressure_rel_inhg;
@Column(name = "wswdat_pressure_abs_hpa")
private Float wswdat_pressure_abs_hpa;
@Column(name = "wswdat_pressure_abs_mb")
private Float wswdat_pressure_abs_mb;
@Column(name = "wswdat_pressure_abs_inhg")
private Float wswdat_pressure_abs_inhg;
@Column(name = "wswdat_precip_rate_mmh")
private Float wswdat_precip_rate_mmh;
@Column(name = "wswdat_precip_rate_inh")
private Float wswdat_precip_rate_inh;
@Column(name = "wswdat_precip_today_mm")
private Float wswdat_precip_today_mm;
@Column(name = "wswdat_precip_today_in")
private Float wswdat_precip_today_in;
@Column(name = "wswdat_wind_degrees")
private Float wswdat_wind_degrees;
@Column(name = "wswdat_wind_dir")
private String wswdat_wind_dir;
@Column(name = "wswdat_wind_speed_kmh")
private Float wswdat_wind_speed_kmh;
@Column(name = "wswdat_wind_speed_mph")
private Float wswdat_wind_speed_mph;
@Column(name = "wswdat_wind_speed_ms")
private Float wswdat_wind_speed_ms;
@Column(name = "wswdat_windchill_c")
private Float wswdat_windchill_c;
@Column(name = "wswdat_windchill_f")
private Float wswdat_windchill_f;
@Column(name = "wswdat_heat_index_c")
private Float wswdat_heat_index_c;
@Column(name = "wswdat_heat_index_f")
private Float wswdat_heat_index_f;
@Column(name = "wswdat_solar_rad_wm2")
private Float wswdat_solar_rad_wm2;
@Column(name = "wswdat_illuminance_lux")
private Float wswdat_illuminance_lux;
@Column(name = "wswdat_uv_index")
private Float wswdat_uv_index;
@Column(name = "wswdat_eto_mm")
private Float wswdat_eto_mm;
@Column(name = "wswdat_wind_gust_kmh")
private Float wswdat_wind_gust_kmh;
@Column(name = "wswdat_wind_gust_mph")
private Float wswdat_wind_gust_mph;
@Column(name = "wswdat_wind_gust_ms")
private Float wswdat_wind_gust_ms;
@Column(name = "wswdat_report_date")
 private LocalDateTime wswdat_report_date;
@Column(name = "wswdat_realfeel_c")
private Float wswdat_realfeel_c;
@Column(name = "wswdat_realfeel_f")
private Float wswdat_realfeel_f;

public Long getData_id() {
    return data_id;
}
public void setData_id(Long data_id) {
    this.data_id = data_id;
}
public String getId_estacion() {
    return id_estacion;
}
public void setId_estacion(String id_estacion) {
    this.id_estacion = id_estacion;
}
public Float getWswdat_temp_c() {
    return wswdat_temp_c;
}
public void setWswdat_temp_c(Float wswdat_temp_c) {
    this.wswdat_temp_c = wswdat_temp_c;
}
public Float getWswdat_temp_f() {
    return wswdat_temp_f;
}
public void setWswdat_temp_f(Float wswdat_temp_f) {
    this.wswdat_temp_f = wswdat_temp_f;
}
public Float getWswdat_relative_humidity() {
    return wswdat_relative_humidity;
}
public void setWswdat_relative_humidity(Float wswdat_relative_humidity) {
    this.wswdat_relative_humidity = wswdat_relative_humidity;
}
public Float getWswdat_dewpoint_c() {
    return wswdat_dewpoint_c;
}
public void setWswdat_dewpoint_c(Float wswdat_dewpoint_c) {
    this.wswdat_dewpoint_c = wswdat_dewpoint_c;
}
public Float getWswdat_dewpoint_f() {
    return wswdat_dewpoint_f;
}
public void setWswdat_dewpoint_f(Float wswdat_dewpoint_f) {
    this.wswdat_dewpoint_f = wswdat_dewpoint_f;
}
public Float getWswdat_pressure_rel_hpa() {
    return wswdat_pressure_rel_hpa;
}
public void setWswdat_pressure_rel_hpa(Float wswdat_pressure_rel_hpa) {
    this.wswdat_pressure_rel_hpa = wswdat_pressure_rel_hpa;
}
public Float getWswdat_pressure_rel_mb() {
    return wswdat_pressure_rel_mb;
}
public void setWswdat_pressure_rel_mb(Float wswdat_pressure_rel_mb) {
    this.wswdat_pressure_rel_mb = wswdat_pressure_rel_mb;
}
public Float getWswdat_pressure_rel_inhg() {
    return wswdat_pressure_rel_inhg;
}
public void setWswdat_pressure_rel_inhg(Float wswdat_pressure_rel_inhg) {
    this.wswdat_pressure_rel_inhg = wswdat_pressure_rel_inhg;
}
public Float getWswdat_pressure_abs_hpa() {
    return wswdat_pressure_abs_hpa;
}
public void setWswdat_pressure_abs_hpa(Float wswdat_pressure_abs_hpa) {
    this.wswdat_pressure_abs_hpa = wswdat_pressure_abs_hpa;
}
public Float getWswdat_pressure_abs_mb() {
    return wswdat_pressure_abs_mb;
}
public void setWswdat_pressure_abs_mb(Float wswdat_pressure_abs_mb) {
    this.wswdat_pressure_abs_mb = wswdat_pressure_abs_mb;
}
public Float getWswdat_pressure_abs_inhg() {
    return wswdat_pressure_abs_inhg;
}
public void setWswdat_pressure_abs_inhg(Float wswdat_pressure_abs_inhg) {
    this.wswdat_pressure_abs_inhg = wswdat_pressure_abs_inhg;
}
public Float getWswdat_precip_rate_mmh() {
    return wswdat_precip_rate_mmh;
}
public void setWswdat_precip_rate_mmh(Float wswdat_precip_rate_mmh) {
    this.wswdat_precip_rate_mmh = wswdat_precip_rate_mmh;
}
public Float getWswdat_precip_rate_inh() {
    return wswdat_precip_rate_inh;
}
public void setWswdat_precip_rate_inh(Float wswdat_precip_rate_inh) {
    this.wswdat_precip_rate_inh = wswdat_precip_rate_inh;
}
public Float getWswdat_precip_today_mm() {
    return wswdat_precip_today_mm;
}
public void setWswdat_precip_today_mm(Float wswdat_precip_today_mm) {
    this.wswdat_precip_today_mm = wswdat_precip_today_mm;
}
public Float getWswdat_precip_today_in() {
    return wswdat_precip_today_in;
}
public void setWswdat_precip_today_in(Float wswdat_precip_today_in) {
    this.wswdat_precip_today_in = wswdat_precip_today_in;
}
public Float getWswdat_wind_degrees() {
    return wswdat_wind_degrees;
}
public void setWswdat_wind_degrees(Float wswdat_wind_degrees) {
    this.wswdat_wind_degrees = wswdat_wind_degrees;
}
public String getWswdat_wind_dir() {
    return wswdat_wind_dir;
}
public void setWswdat_wind_dir(String wswdat_wind_dir) {
    this.wswdat_wind_dir = wswdat_wind_dir;
}
public Float getWswdat_wind_speed_kmh() {
    return wswdat_wind_speed_kmh;
}
public void setWswdat_wind_speed_kmh(Float wswdat_wind_speed_kmh) {
    this.wswdat_wind_speed_kmh = wswdat_wind_speed_kmh;
}
public Float getWswdat_wind_speed_mph() {
    return wswdat_wind_speed_mph;
}
public void setWswdat_wind_speed_mph(Float wswdat_wind_speed_mph) {
    this.wswdat_wind_speed_mph = wswdat_wind_speed_mph;
}
public Float getWswdat_wind_speed_ms() {
    return wswdat_wind_speed_ms;
}
public void setWswdat_wind_speed_ms(Float wswdat_wind_speed_ms) {
    this.wswdat_wind_speed_ms = wswdat_wind_speed_ms;
}
public Float getWswdat_windchill_c() {
    return wswdat_windchill_c;
}
public void setWswdat_windchill_c(Float wswdat_windchill_c) {
    this.wswdat_windchill_c = wswdat_windchill_c;
}
public Float getWswdat_windchill_f() {
    return wswdat_windchill_f;
}
public void setWswdat_windchill_f(Float wswdat_windchill_f) {
    this.wswdat_windchill_f = wswdat_windchill_f;
}
public Float getWswdat_heat_index_c() {
    return wswdat_heat_index_c;
}
public void setWswdat_heat_index_c(Float wswdat_heat_index_c) {
    this.wswdat_heat_index_c = wswdat_heat_index_c;
}
public Float getWswdat_heat_index_f() {
    return wswdat_heat_index_f;
}
public void setWswdat_heat_index_f(Float wswdat_heat_index_f) {
    this.wswdat_heat_index_f = wswdat_heat_index_f;
}
public Float getWswdat_solar_rad_wm2() {
    return wswdat_solar_rad_wm2;
}
public void setWswdat_solar_rad_wm2(Float wswdat_solar_rad_wm2) {
    this.wswdat_solar_rad_wm2 = wswdat_solar_rad_wm2;
}
public Float getWswdat_illuminance_lux() {
    return wswdat_illuminance_lux;
}
public void setWswdat_illuminance_lux(Float wswdat_illuminance_lux) {
    this.wswdat_illuminance_lux = wswdat_illuminance_lux;
}
public Float getWswdat_uv_index() { 
    return wswdat_uv_index;
}
public void setWswdat_uv_index(Float wswdat_uv_index) {
    this.wswdat_uv_index = wswdat_uv_index;
}
public Float getWswdat_eto_mm() {
    return wswdat_eto_mm;
}
public void setWswdat_eto_mm(Float wswdat_eto_mm) {
    this.wswdat_eto_mm = wswdat_eto_mm;
}
public Float getWswdat_wind_gust_kmh() {
    return wswdat_wind_gust_kmh;
}
public void setWswdat_wind_gust_kmh(Float wswdat_wind_gust_kmh) {
    this.wswdat_wind_gust_kmh = wswdat_wind_gust_kmh;
}
public Float getWswdat_wind_gust_mph() {
    return wswdat_wind_gust_mph;
}
public void setWswdat_wind_gust_mph(Float wswdat_wind_gust_mph) {
    this.wswdat_wind_gust_mph = wswdat_wind_gust_mph;
}
public Float getWswdat_wind_gust_ms() {
    return wswdat_wind_gust_ms;
}
public void setWswdat_wind_gust_ms(Float wswdat_wind_gust_ms) {
    this.wswdat_wind_gust_ms = wswdat_wind_gust_ms;
}
public LocalDateTime getWswdat_report_date() {
    return wswdat_report_date;
}
public void setWswdat_report_date(LocalDateTime wswdat_report_date) {
    this.wswdat_report_date = wswdat_report_date;
}
public Float getWswdat_realfeel_c() {
    return wswdat_realfeel_c;
}
public void setWswdat_realfeel_c(Float wswdat_realfeel_c) {
    this.wswdat_realfeel_c = wswdat_realfeel_c;
}
public Float getWswdat_realfeel_f() {
    return wswdat_realfeel_f;
}
public void setWswdat_realfeel_f(Float wswdat_realfeel_f) {
    this.wswdat_realfeel_f = wswdat_realfeel_f;
}



}