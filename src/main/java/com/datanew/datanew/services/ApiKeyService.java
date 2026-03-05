package com.datanew.datanew.services;

import com.datanew.datanew.models.entities.ApiKey;

import java.util.List;
import java.util.Optional;

public interface ApiKeyService {

    ApiKey generateApiKey(String idEstacion, String username);

    List<ApiKey> getApiKeysByUsername(String username);

    Optional<ApiKey> validateApiKey(String apiKey);

    void toggleStatus(Long id);

    void deleteApiKey(Long id);
}
