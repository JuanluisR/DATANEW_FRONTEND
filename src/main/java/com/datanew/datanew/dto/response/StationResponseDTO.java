package com.datanew.datanew.dto.response;

import com.datanew.datanew.models.entities.Station;

public class StationResponseDTO {

    private Long id;
    private String id_estacion;
    private String nombre_estacion;
    private Double lat;
    private Double lon;
    private Double elevacion;
    private Double altura_suelo;
    private String departamento;
    private String ciudad;
    private String estado;
    private String pais;
    private String marca;
    private String modelo;
    private String username;
    private String weatherlink_id;
    private String freq;
    private String tipo_estacion;

    public static StationResponseDTO fromEntity(Station station) {
        StationResponseDTO dto = new StationResponseDTO();
        dto.id = station.getId();
        dto.id_estacion = station.getId_estacion();
        dto.nombre_estacion = station.getNombre_estacion();
        dto.lat = station.getLat();
        dto.lon = station.getLon();
        dto.elevacion = station.getElevacion();
        dto.altura_suelo = station.getAltura_suelo();
        dto.departamento = station.getDepartamento();
        dto.ciudad = station.getCiudad();
        dto.estado = station.getEstado();
        dto.pais = station.getPais();
        dto.marca = station.getMarca();
        dto.modelo = station.getModelo();
        dto.username = station.getUsername();
        dto.weatherlink_id = station.getWeatherlink_id();
        dto.freq = station.getFreq();
        dto.tipo_estacion = station.getTipo_estacion();
        return dto;
    }

    public Long getId() { return id; }
    public String getId_estacion() { return id_estacion; }
    public String getNombre_estacion() { return nombre_estacion; }
    public Double getLat() { return lat; }
    public Double getLon() { return lon; }
    public Double getElevacion() { return elevacion; }
    public Double getAltura_suelo() { return altura_suelo; }
    public String getDepartamento() { return departamento; }
    public String getCiudad() { return ciudad; }
    public String getEstado() { return estado; }
    public String getPais() { return pais; }
    public String getMarca() { return marca; }
    public String getModelo() { return modelo; }
    public String getUsername() { return username; }
    public String getWeatherlink_id() { return weatherlink_id; }
    public String getFreq() { return freq; }
    public String getTipo_estacion() { return tipo_estacion; }
}
