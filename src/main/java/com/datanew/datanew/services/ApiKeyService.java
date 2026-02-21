package com.datanew.datanew.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.datanew.datanew.models.entities.ApiKey;
import com.datanew.datanew.repositories.ApiKeyRepository;

@Service
public class ApiKeyService {

    @Autowired
    private ApiKeyRepository repository;

    @Transactional
    public ApiKey generateApiKey(String idEstacion, String username) {
        String apiKey = UUID.randomUUID().toString().replace("-", "");
        
        ApiKey key = new ApiKey();
        key.setApiKey(apiKey);
        key.setIdEstacion(idEstacion);
        key.setUsername(username);
        key.setCreatedAt(LocalDateTime.now());
        key.setStatus(true);
        
        return repository.save(key);
    }

    @Transactional(readOnly = true)
    public List<ApiKey> getApiKeysByUsername(String username) {
        return repository.findAll().stream()
            .filter(key -> key.getUsername().equals(username))
            .toList();
    }

    @Transactional(readOnly = true)
    public Optional<ApiKey> validateApiKey(String apiKey) {
        return repository.findByApiKeyAndStatusTrue(apiKey);
    }

    @Transactional
    public void toggleStatus(Long id) {
        Optional<ApiKey> keyOpt = repository.findById(id);
        if (keyOpt.isPresent()) {
            ApiKey key = keyOpt.get();
            key.setStatus(!key.getStatus());
            repository.save(key);
        }
    }

    @Transactional
    public void deleteApiKey(Long id) {
        repository.deleteById(id);
    }
}
