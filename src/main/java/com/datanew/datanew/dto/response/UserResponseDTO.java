package com.datanew.datanew.dto.response;

import com.datanew.datanew.models.entities.User;

public class UserResponseDTO {

    private Long id;
    private String username;
    private String email;
    private String first_name;
    private String last_name;
    private Boolean is_superuser;
    private Boolean is_staff;
    private Boolean is_active;
    private String biografia;
    private String enlace;
    private String empresa;
    private String telefono;
    private String pais;
    private String estado;
    private String ciudad;
    private String codigoPostal;
    private String imagen;

    public static UserResponseDTO fromEntity(User user) {
        UserResponseDTO dto = new UserResponseDTO();
        dto.id = user.getId();
        dto.username = user.getUsername();
        dto.email = user.getEmail();
        dto.first_name = user.getFirst_name();
        dto.last_name = user.getLast_name();
        dto.is_superuser = user.getIs_superuser();
        dto.is_staff = user.getIs_staff();
        dto.is_active = user.getIs_active();
        dto.biografia = user.getBiografia();
        dto.enlace = user.getEnlace();
        dto.empresa = user.getEmpresa();
        dto.telefono = user.getTelefono();
        dto.pais = user.getPais();
        dto.estado = user.getEstado();
        dto.ciudad = user.getCiudad();
        dto.codigoPostal = user.getCodigoPostal();
        dto.imagen = user.getImagen();
        return dto;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getFirst_name() { return first_name; }
    public String getLast_name() { return last_name; }
    public Boolean getIs_superuser() { return is_superuser; }
    public Boolean getIs_staff() { return is_staff; }
    public Boolean getIs_active() { return is_active; }
    public String getBiografia() { return biografia; }
    public String getEnlace() { return enlace; }
    public String getEmpresa() { return empresa; }
    public String getTelefono() { return telefono; }
    public String getPais() { return pais; }
    public String getEstado() { return estado; }
    public String getCiudad() { return ciudad; }
    public String getCodigoPostal() { return codigoPostal; }
    public String getImagen() { return imagen; }
}
