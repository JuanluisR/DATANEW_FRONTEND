package com.datanew.datanew.models.entities;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(name = "estaciones", indexes = {
    @Index(name = "idx_station_username", columnList = "username")
})
public class Station {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_estacion")
    private String id_estacion;

@Column(name = "nombre_estacion")
    private String nombre_estacion;
@Column(name = "lat")
    private Double lat;
    @Column(name = "lon")
    private Double lon;
   // @Column(unique = true)
   @Column(name = "forecast_key")
    private String forecast_key;
   @Column(name = "elevacion")
    private Double elevacion;
   @Column(name = "altura_suelo")
    private Double altura_suelo;
   @Column(name = "departamento")
    private String departamento;
@Column(name = "ciudad")
    private String ciudad;
    @Column(name = "estado")
    private String estado;
@Column(name = "pais")
    private String pais;
    @Column(name = "marca")
    private String marca;
    @Column(name = "modelo")
    private String modelo;
    // @Column(unique = true)
@Column(name = "key")
    private String key;
    //@Column(unique = true)
    @Column(name = "passkey")
    private String passkey;
    @Column(name = "username")
    private String username;
    @Column(name = "weatherlink_id")
    private String weatherlink_id;
    @Column(name = "api_key")
    private String api_key;
    @Column(name = "api_secret")
    private String  api_secret;
    @Column(name = "imei")
    private String imei;
    @Column(name = "freq")
     private String freq;

    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public String getId_estacion() {
        return id_estacion;
    }
    public void setId_estacion(String id_estacion) {
        this.id_estacion = id_estacion;
    }
    public String getNombre_estacion() {
        return nombre_estacion;
    }
    public void setNombre_estacion(String nombre_estacion) {
        this.nombre_estacion = nombre_estacion;
    }
public Double getLat() {
        return lat;
    }
    public void setLat(Double lat) {
        this.lat = lat;
    }
    public Double getLon() {
        return lon;
    }
    public void setLon(Double lon) {
        this.lon = lon;
    }
    public String getForecast_key() {
        return forecast_key;
    }
    public void setForecast_key(String forecast_key) {
        this.forecast_key = forecast_key;
    }
public Double getAltura_suelo() {
        return altura_suelo;
    }
    public void setAltura_suelo(Double altura_suelo) {
        this.altura_suelo = altura_suelo;
    }
    public Double getElevacion() {
        return elevacion;
    }
    public void setElevacion(Double elevacion) {
        this.elevacion = elevacion;
    }
    public String getDepartamento() {
        return departamento;
    }
    public void setDepartamento(String departamento) {
        this.departamento = departamento;
    }
    public String getCiudad() {
        return ciudad;
    }
    public void setCiudad(String ciudad) {
        this.ciudad = ciudad;
    }
    public String getEstado() {
        return estado;
    }
    public void setEstado(String estado) {
        this.estado = estado;
    }
    public String getPais() {
        return pais;
    }
    public void setPais(String pais) {
        this.pais = pais;
    }
    public String getMarca() {
        return marca;
    }
    public void setMarca(String marca) {
        this.marca = marca;
    }
    public String getModelo() {
        return modelo;
    }
    public void setModelo(String modelo) {
        this.modelo = modelo;
    }
    public String getKey() {
        return key;
    }
    public void setKey(String key) {
        this.key = key;
    }
    public String getPasskey() {
        return passkey;
    }
    public void setPasskey(String passkey) {
        this.passkey = passkey;
    }
    public String getUsername() {
        return username;
    }
    public void setUsername(String username) {
        this.username = username;
    }
    public String getWeatherlink_id() {
        return weatherlink_id;
    }
    public void setWeatherlink_id(String weatherlink_id) {
        this.weatherlink_id = weatherlink_id;
    }
    public String getApi_key() {
        return api_key;
    }
    public void setApi_key(String api_key) {
        this.api_key = api_key;
    }
    public String getApi_secret() {
        return api_secret;
    }
    public void setApi_secret(String api_secret) {
        this.api_secret = api_secret;
    }
    public String getImei() {
        return imei;
    }
    public void setImei(String imei) {
        this.imei = imei;
    }
    public String getFreq() {
        return freq;
    }
    public void setFreq(String freq) {
        this.freq = freq;
    }



    


}