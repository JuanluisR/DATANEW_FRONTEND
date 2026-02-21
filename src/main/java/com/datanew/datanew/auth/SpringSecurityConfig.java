package com.datanew.datanew.auth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SpringSecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private ApiKeyAuthenticationFilter apiKeyAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // CSRF disabled for REST API (stateless with JWT)
            .csrf(csrf -> csrf.disable())

            // CORS configuration - MUST be before authorization
            .cors(cors -> cors.configure(http))

            // Session management - stateless for JWT
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // Authorization configuration
            .authorizeHttpRequests(auth -> auth
                // Permitir peticiones OPTIONS para CORS preflight
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Permitir endpoints de autenticación
                .requestMatchers("/auth/**").permitAll()
                // Permitir registro de usuarios (POST /user)
                .requestMatchers(HttpMethod.POST, "/user").permitAll()
                // Permitir generación de API keys
                .requestMatchers("/api-key/**").permitAll()
                // Permitir recepción de datos de estaciones meteorológicas (sin JWT)
                .requestMatchers(HttpMethod.POST, "/data").permitAll()
                // Permitir consulta de datos con API Key
                .requestMatchers("/data/latest/**").permitAll()
                .requestMatchers("/data/stats/**").permitAll()
                .requestMatchers("/data/query/**").permitAll()
                .requestMatchers("/data/history/**").permitAll()
                // Todos los demás requieren autenticación
                .anyRequest().authenticated()
            )

            // Agregar filtro API Key antes del JWT
            .addFilterBefore(apiKeyAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            // Agregar filtro JWT
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
