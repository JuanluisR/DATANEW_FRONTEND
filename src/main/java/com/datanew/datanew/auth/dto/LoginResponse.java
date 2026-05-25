package com.datanew.datanew.auth.dto;

public class LoginResponse {

    private Long id;
    private String token;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private boolean isActive;
    private boolean isStaff;
    private boolean isSuperuser;
    private String imagen;
    private String empresa;

    public LoginResponse() {
    }

    public LoginResponse(Long id, String token, String username, String email, String firstName, String lastName,
                        boolean isActive, boolean isStaff, boolean isSuperuser, String imagen, String empresa) {
        this.id = id;
        this.token = token;
        this.username = username;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.isActive = isActive;
        this.isStaff = isStaff;
        this.isSuperuser = isSuperuser;
        this.imagen = imagen;
        this.empresa = empresa;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public boolean isStaff() {
        return isStaff;
    }

    public void setStaff(boolean staff) {
        isStaff = staff;
    }

    public boolean isSuperuser() {
        return isSuperuser;
    }

public void setSuperuser(boolean superuser) {
        isSuperuser = superuser;
    }

    public String getImagen() {
        return imagen;
    }

    public void setImagen(String imagen) {
        this.imagen = imagen;
    }

    public String getEmpresa() {
        return empresa;
    }

    public void setEmpresa(String empresa) {
        this.empresa = empresa;
    }
}
