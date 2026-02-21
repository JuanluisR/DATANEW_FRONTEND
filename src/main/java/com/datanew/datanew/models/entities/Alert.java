package com.datanew.datanew.models.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "alertas")
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre_alerta")
    @NotBlank(message = "El nombre de la alerta es requerido")
    private String nombreAlerta;

    @Column(name = "id_estacion")
    @NotBlank(message = "La estación es requerida")
    private String idEstacion;

    @Column(name = "nombre_estacion")
    private String nombreEstacion;

    @Column(name = "variable")
    @NotBlank(message = "La variable es requerida")
    private String variable; // temp, humidity, pressure, windSpeed, etc.

    @Column(name = "operador")
    @NotBlank(message = "El operador es requerido")
    private String operador; // >, <, >=, <=, ==

    @Column(name = "valor_umbral")
    @NotNull(message = "El valor umbral es requerido")
    private Double valorUmbral;

    @Column(name = "unidad")
    private String unidad; // °C, %, hPa, km/h, etc.

    @Column(name = "notificar_email")
    private Boolean notificarEmail = false;

    @Column(name = "notificar_sms")
    private Boolean notificarSms = false;

    @Column(name = "emails", length = 1000)
    private String emails; // Separados por coma

    @Column(name = "telefonos", length = 500)
    private String telefonos; // Separados por coma

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "username")
    @NotBlank(message = "El usuario es requerido")
    private String username;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @Column(name = "ultima_activacion")
    private LocalDateTime ultimaActivacion;

    @Column(name = "veces_activada")
    private Integer vecesActivada = 0;

    @Column(name = "ultimo_valor_registrado")
    private Double ultimoValorRegistrado;

    @Column(name = "ultimo_email_enviado")
    private LocalDateTime ultimoEmailEnviado;

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

    public String getNombreAlerta() {
        return nombreAlerta;
    }

    public void setNombreAlerta(String nombreAlerta) {
        this.nombreAlerta = nombreAlerta;
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

    public String getVariable() {
        return variable;
    }

    public void setVariable(String variable) {
        this.variable = variable;
    }

    public String getOperador() {
        return operador;
    }

    public void setOperador(String operador) {
        this.operador = operador;
    }

    public Double getValorUmbral() {
        return valorUmbral;
    }

    public void setValorUmbral(Double valorUmbral) {
        this.valorUmbral = valorUmbral;
    }

    public String getUnidad() {
        return unidad;
    }

    public void setUnidad(String unidad) {
        this.unidad = unidad;
    }

    public Boolean getNotificarEmail() {
        return notificarEmail;
    }

    public void setNotificarEmail(Boolean notificarEmail) {
        this.notificarEmail = notificarEmail;
    }

    public Boolean getNotificarSms() {
        return notificarSms;
    }

    public void setNotificarSms(Boolean notificarSms) {
        this.notificarSms = notificarSms;
    }

    public String getEmails() {
        return emails;
    }

    public void setEmails(String emails) {
        this.emails = emails;
    }

    public String getTelefonos() {
        return telefonos;
    }

    public void setTelefonos(String telefonos) {
        this.telefonos = telefonos;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
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

    public LocalDateTime getUltimaActivacion() {
        return ultimaActivacion;
    }

    public void setUltimaActivacion(LocalDateTime ultimaActivacion) {
        this.ultimaActivacion = ultimaActivacion;
    }

    public Integer getVecesActivada() {
        return vecesActivada;
    }

    public void setVecesActivada(Integer vecesActivada) {
        this.vecesActivada = vecesActivada;
    }

    public Double getUltimoValorRegistrado() {
        return ultimoValorRegistrado;
    }

    public void setUltimoValorRegistrado(Double ultimoValorRegistrado) {
        this.ultimoValorRegistrado = ultimoValorRegistrado;
    }

    public LocalDateTime getUltimoEmailEnviado() {
        return ultimoEmailEnviado;
    }

    public void setUltimoEmailEnviado(LocalDateTime ultimoEmailEnviado) {
        this.ultimoEmailEnviado = ultimoEmailEnviado;
    }
}
