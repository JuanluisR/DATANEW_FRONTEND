package com.datanew.datanew.models.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "cultivos", indexes = {
    @Index(name = "idx_cultivo_username", columnList = "username"),
    @Index(name = "idx_cultivo_id_estacion", columnList = "id_estacion")
})
public class Cultivo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre_cultivo")
    @NotBlank(message = "El nombre del cultivo es requerido")
    private String nombreCultivo;

    @Column(name = "tipo_cultivo")
    @NotBlank(message = "El tipo de cultivo es requerido")
    private String tipoCultivo; // papa, aguacate, arroz, flores, mariguana

    @Column(name = "id_estacion")
    @NotBlank(message = "La estación es requerida")
    private String idEstacion;

    @Column(name = "nombre_estacion")
    private String nombreEstacion;

    @Column(name = "username")
    @NotBlank(message = "El usuario es requerido")
    private String username;

    @Column(name = "fecha_siembra")
    @NotNull(message = "La fecha de siembra es requerida")
    private LocalDate fechaSiembra;

    @Column(name = "fecha_cosecha_estimada")
    private LocalDate fechaCosechaEstimada;

    @Column(name = "etapa_actual")
    private String etapaActual; // inicial, desarrollo, media, final

    @Column(name = "dias_desde_siembra")
    private Integer diasDesdeSiembra;

    @Column(name = "kc_actual")
    private Double kcActual; // Coeficiente de cultivo actual

    @Column(name = "area_hectareas")
    private Double areaHectareas;

    @Column(name = "tipo_suelo")
    private String tipoSuelo; // arenoso, franco, arcilloso

    @Column(name = "capacidad_campo")
    private Double capacidadCampo; // mm

    @Column(name = "punto_marchitez")
    private Double puntoMarchitez; // mm

    @Column(name = "profundidad_raices")
    private Double profundidadRaices; // cm

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @Column(name = "notas", length = 1000)
    private String notas;

    @PrePersist
    protected void onCreate() {
        fechaCreacion = LocalDateTime.now();
        fechaActualizacion = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        fechaActualizacion = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombreCultivo() {
        return nombreCultivo;
    }

    public void setNombreCultivo(String nombreCultivo) {
        this.nombreCultivo = nombreCultivo;
    }

    public String getTipoCultivo() {
        return tipoCultivo;
    }

    public void setTipoCultivo(String tipoCultivo) {
        this.tipoCultivo = tipoCultivo;
    }

    public String getIdEstacion() {
        return idEstacion;
    }

    public void setIdEstacion(String idEstacion) {
        this.idEstacion = idEstacion;
    }

    public String getNombreEstacion() {
        return nombreEstacion;
    }

    public void setNombreEstacion(String nombreEstacion) {
        this.nombreEstacion = nombreEstacion;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public LocalDate getFechaSiembra() {
        return fechaSiembra;
    }

    public void setFechaSiembra(LocalDate fechaSiembra) {
        this.fechaSiembra = fechaSiembra;
    }

    public LocalDate getFechaCosechaEstimada() {
        return fechaCosechaEstimada;
    }

    public void setFechaCosechaEstimada(LocalDate fechaCosechaEstimada) {
        this.fechaCosechaEstimada = fechaCosechaEstimada;
    }

    public String getEtapaActual() {
        return etapaActual;
    }

    public void setEtapaActual(String etapaActual) {
        this.etapaActual = etapaActual;
    }

    public Integer getDiasDesdeSiembra() {
        return diasDesdeSiembra;
    }

    public void setDiasDesdeSiembra(Integer diasDesdeSiembra) {
        this.diasDesdeSiembra = diasDesdeSiembra;
    }

    public Double getKcActual() {
        return kcActual;
    }

    public void setKcActual(Double kcActual) {
        this.kcActual = kcActual;
    }

    public Double getAreaHectareas() {
        return areaHectareas;
    }

    public void setAreaHectareas(Double areaHectareas) {
        this.areaHectareas = areaHectareas;
    }

    public String getTipoSuelo() {
        return tipoSuelo;
    }

    public void setTipoSuelo(String tipoSuelo) {
        this.tipoSuelo = tipoSuelo;
    }

    public Double getCapacidadCampo() {
        return capacidadCampo;
    }

    public void setCapacidadCampo(Double capacidadCampo) {
        this.capacidadCampo = capacidadCampo;
    }

    public Double getPuntoMarchitez() {
        return puntoMarchitez;
    }

    public void setPuntoMarchitez(Double puntoMarchitez) {
        this.puntoMarchitez = puntoMarchitez;
    }

    public Double getProfundidadRaices() {
        return profundidadRaices;
    }

    public void setProfundidadRaices(Double profundidadRaices) {
        this.profundidadRaices = profundidadRaices;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public LocalDateTime getFechaActualizacion() {
        return fechaActualizacion;
    }

    public void setFechaActualizacion(LocalDateTime fechaActualizacion) {
        this.fechaActualizacion = fechaActualizacion;
    }

    public String getNotas() {
        return notas;
    }

    public void setNotas(String notas) {
        this.notas = notas;
    }
}
