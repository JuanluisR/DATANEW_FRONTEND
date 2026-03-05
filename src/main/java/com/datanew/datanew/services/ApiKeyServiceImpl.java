package com.datanew.datanew.services;

import com.datanew.datanew.models.entities.ApiKey;
import com.datanew.datanew.repositories.ApiKeyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ApiKeyServiceImpl implements ApiKeyService {

    @Autowired
    private ApiKeyRepository repository;

    @Override
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

    @Override
    @Transactional(readOnly = true)
    public List<ApiKey> getApiKeysByUsername(String username) {
        return repository.findByUsername(username);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ApiKey> validateApiKey(String apiKey) {
        return repository.findByApiKeyAndStatusTrue(apiKey);
    }

    @Override
    @Transactional
    public void toggleStatus(Long id) {
        repository.findById(id).ifPresent(key -> {
            key.setStatus(!key.getStatus());
            repository.save(key);
        });
    }

    @Override
    @Transactional
    public void deleteApiKey(Long id) {
        repository.deleteById(id);
    }
}
