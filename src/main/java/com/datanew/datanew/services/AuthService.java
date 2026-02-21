package com.datanew.datanew.services;

import com.datanew.datanew.auth.JwtUtil;
import com.datanew.datanew.auth.dto.LoginRequest;
import com.datanew.datanew.auth.dto.LoginResponse;
import com.datanew.datanew.models.entities.User;
import com.datanew.datanew.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    public LoginResponse login(LoginRequest loginRequest) {
        // Buscar usuario por username
        Optional<User> userOptional = userRepository.findByUsername(loginRequest.getUsername());

        if (userOptional.isEmpty()) {
            throw new RuntimeException("Invalid username or password");
        }

        User user = userOptional.get();

        // Verificar si el usuario está activo
        if (user.getIs_active() != null && !user.getIs_active()) {
            throw new RuntimeException("User account is inactive");
        }

        // Verificar password
        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid username or password");
        }

        // Generar token JWT
        String token = jwtUtil.generateToken(user.getUsername());

// Crear respuesta
        return new LoginResponse(
            user.getId(),
            token,
            user.getUsername(),
            user.getEmail(),
            user.getFirst_name(),
            user.getLast_name(),
            user.getIs_active() != null ? user.getIs_active() : true,
            user.getIs_staff() != null ? user.getIs_staff() : false,
            user.getIs_superuser() != null ? user.getIs_superuser() : false,
            user.getImagen() != null ? user.getImagen() : "",
            user.getEmpresa() != null ? user.getEmpresa() : ""
        );
    }

    public void changePassword(String username, String currentPassword, String newPassword) {
        Optional<User> userOptional = userRepository.findByUsername(username);
        
        if (userOptional.isEmpty()) {
            throw new RuntimeException("Usuario no encontrado");
        }

        User user = userOptional.get();

        // Verificar contraseña actual
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("La contraseña actual es incorrecta");
        }

        // Actualizar contraseña
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public void changeEmail(String username, String newEmail, String password) {
        Optional<User> userOptional = userRepository.findByUsername(username);
        
        if (userOptional.isEmpty()) {
            throw new RuntimeException("Usuario no encontrado");
        }

        User user = userOptional.get();

        // Verificar contraseña
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("La contraseña es incorrecta");
        }

        // Verificar si el correo ya está en uso
        Optional<User> existingUser = userRepository.findByEmail(newEmail);
        if (existingUser.isPresent() && !existingUser.get().getId().equals(user.getId())) {
            throw new RuntimeException("El correo electrónico ya está en uso");
        }

        // Actualizar correo
        user.setEmail(newEmail);
        userRepository.save(user);
    }
}
