package com.datanew.datanew.Controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.datanew.datanew.models.entities.ApiKey;
import com.datanew.datanew.services.ApiKeyService;

@RestController
@RequestMapping("/api-key")
public class ApiKeyController {

    @Autowired
    private ApiKeyService service;

    @PostMapping("/generate")
    public ResponseEntity<ApiKey> generateApiKey(
            @RequestParam("idEstacion") String idEstacion,
            @RequestParam("username") String username) {
        ApiKey apiKey = service.generateApiKey(idEstacion, username);
        return ResponseEntity.ok(apiKey);
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<List<ApiKey>> getApiKeysByUser(@PathVariable String username) {
        return ResponseEntity.ok(service.getApiKeysByUsername(username));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<Void> toggleStatus(@PathVariable Long id) {
        service.toggleStatus(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteApiKey(@PathVariable Long id) {
        service.deleteApiKey(id);
        return ResponseEntity.noContent().build();
    }
}
