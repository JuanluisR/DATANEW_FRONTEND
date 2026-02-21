package com.datanew.datanew.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.datanew.datanew.models.entities.ApiKey;

@Repository
public interface ApiKeyRepository extends JpaRepository<ApiKey, Long> {
    Optional<ApiKey> findByApiKeyAndStatusTrue(String apiKey);
    Optional<ApiKey> findByApiKey(String apiKey);
    boolean existsByApiKey(String apiKey);
}
