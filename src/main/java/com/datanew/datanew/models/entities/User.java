package com.datanew.datanew.models.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "Usuarios", indexes = {
    @Index(name = "idx_user_username", columnList = "username"),
    @Index(name = "idx_user_email", columnList = "email")
})
public class User {

@Id 
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

@Column(name = "password")
@NotBlank(message = "Password is required")
@Size(min = 6, message = "Password must be at least 6 characters")
private String password;


private Boolean is_superuser;
@Column(name = "username")
@NotBlank(message = "Username is required")
@Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
private String username;
@Column(name = "first_name")
@NotBlank(message = "First name is required")
@Size(max = 50, message = "First name must not exceed 50 characters")
private String first_name;
@Column(name = "last_name")
@NotBlank(message = "Last name is required")
@Size(max = 50, message = "Last name must not exceed 50 characters")
private String last_name;
@Column(name = "email")
@NotBlank(message = "Email is required")
@Email(message = "Email should be valid")
private String email;

private Boolean  is_staff;

private Boolean  is_active;
@Column(name = "last_login")
private LocalDateTime last_login;
@Column(name = "date_joined")
private LocalDateTime date_joined;

@Column(name = "biografia", columnDefinition = "TEXT")
private String biografia;

@Column(name = "enlace")
private String enlace;

@Column(name = "empresa")
private String empresa;

@Column(name = "telefono")
private String telefono;

@Column(name = "pais")
private String pais;

@Column(name = "estado")
private String estado;

@Column(name = "ciudad")
private String ciudad;

@Column(name = "codigo_postal")
    private String codigoPostal;

    @Column(name = "imagen")
    private String imagen;


public LocalDateTime getLast_login() {
    return last_login;
}
public void setLast_login(LocalDateTime last_login) {
    this.last_login = last_login;
}
public LocalDateTime getDate_joined() {
    return date_joined;
}
public void setDate_joined(LocalDateTime date_joined) {
    this.date_joined = date_joined;
}
public Long getId() {
    return id;
}
public void setId(Long id) {
    this.id = id;
}
public String getPassword() {
    return password;
}
public void setPassword(String password) {
    this.password = password;
}

public String getUsername() {
    return username;
}
public void setUsername(String username) {
    this.username = username;
}
public String getFirst_name() {
    return first_name;
}
public void setFirst_name(String first_name) {
    this.first_name = first_name;
}
public String getLast_name() {
    return last_name;
}
public void setLast_name(String last_name) {
    this.last_name = last_name;
}
public String getEmail() {
    return email;
}
public void setEmail(String email) {
    this.email = email;
}
public Boolean getIs_superuser() {
    return is_superuser;
}
public void setIs_superuser(Boolean is_superuser) {
    this.is_superuser = is_superuser;
}
public Boolean getIs_staff() {
    return is_staff;
}
public void setIs_staff(Boolean is_staff) {
    this.is_staff = is_staff;
}
public Boolean getIs_active() {
    return is_active;
}
public void setIs_active(Boolean is_active) {
    this.is_active = is_active;
}

public String getBiografia() {
    return biografia;
}
public void setBiografia(String biografia) {
    this.biografia = biografia;
}
public String getEnlace() {
    return enlace;
}
public void setEnlace(String enlace) {
    this.enlace = enlace;
}
public String getEmpresa() {
    return empresa;
}
public void setEmpresa(String empresa) {
    this.empresa = empresa;
}
public String getTelefono() {
    return telefono;
}
public void setTelefono(String telefono) {
    this.telefono = telefono;
}
public String getPais() {
    return pais;
}
public void setPais(String pais) {
    this.pais = pais;
}
public String getEstado() {
    return estado;
}
public void setEstado(String estado) {
    this.estado = estado;
}
public String getCiudad() {
    return ciudad;
}
public void setCiudad(String ciudad) {
    this.ciudad = ciudad;
}
public String getCodigoPostal() {
    return codigoPostal;
}
public void setCodigoPostal(String codigoPostal) {
    this.codigoPostal = codigoPostal;
}
public String getImagen() {
    return imagen;
}
public void setImagen(String imagen) {
    this.imagen = imagen;
}

}
