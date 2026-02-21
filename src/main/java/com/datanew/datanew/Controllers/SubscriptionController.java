package com.datanew.datanew.Controllers;

import com.datanew.datanew.models.entities.Subscription;
import com.datanew.datanew.models.enums.PlanType;
import com.datanew.datanew.services.SubscriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/subscription")
public class SubscriptionController {

    @Autowired
    private SubscriptionService subscriptionService;

    @GetMapping
    public List<Subscription> getAllSubscriptions() {
        return subscriptionService.getAllSubscriptions();
    }

    @GetMapping("/plans")
    public ResponseEntity<List<Map<String, Object>>> getAvailablePlans() {
        List<Map<String, Object>> plans = Arrays.stream(PlanType.values())
            .map(plan -> {
                Map<String, Object> planInfo = new HashMap<>();
                planInfo.put("type", plan.name());
                planInfo.put("displayName", plan.getDisplayName());
                planInfo.put("level", plan.getLevel());

                // Add plan-specific features
                switch (plan) {
                    case FREE:
                        planInfo.put("price", 0);
                        planInfo.put("maxStations", 2);
                        planInfo.put("maxSensorsPerStation", 5);
                        planInfo.put("maxAlerts", 3);
                        planInfo.put("dataRetentionDays", 7);
                        planInfo.put("apiAccess", false);
                        planInfo.put("features", Arrays.asList(
                            "Solo visualización",
                            "Solo acceso a Home",
                            "2 estaciones",
                            "5 sensores por estación",
                            "3 alertas",
                            "7 días de retención de datos"
                        ));
                        break;
                    case BASIC:
                        planInfo.put("price", 29.99);
                        planInfo.put("maxStations", 5);
                        planInfo.put("maxSensorsPerStation", 10);
                        planInfo.put("maxAlerts", 10);
                        planInfo.put("dataRetentionDays", 30);
                        planInfo.put("apiAccess", false);
                        planInfo.put("features", Arrays.asList(
                            "5 estaciones",
                            "10 sensores por estación",
                            "10 alertas",
                            "30 días de retención",
                            "Notificaciones por email",
                            "Exportar datos"
                        ));
                        break;
                    case PRO:
                        planInfo.put("price", 79.99);
                        planInfo.put("maxStations", 20);
                        planInfo.put("maxSensorsPerStation", 25);
                        planInfo.put("maxAlerts", 50);
                        planInfo.put("dataRetentionDays", 90);
                        planInfo.put("apiAccess", true);
                        planInfo.put("features", Arrays.asList(
                            "20 estaciones",
                            "25 sensores por estación",
                            "50 alertas",
                            "90 días de retención",
                            "Notificaciones email y SMS",
                            "Acceso API",
                            "Datos en tiempo real",
                            "Análisis avanzados"
                        ));
                        break;
                    case ULTRA:
                        planInfo.put("price", 199.99);
                        planInfo.put("maxStations", -1);
                        planInfo.put("maxSensorsPerStation", -1);
                        planInfo.put("maxAlerts", -1);
                        planInfo.put("dataRetentionDays", 365);
                        planInfo.put("apiAccess", true);
                        planInfo.put("features", Arrays.asList(
                            "Estaciones ilimitadas",
                            "Sensores ilimitados",
                            "Alertas ilimitadas",
                            "365 días de retención",
                            "Todas las notificaciones",
                            "Acceso API completo",
                            "Datos en tiempo real",
                            "Análisis avanzados",
                            "Reportes personalizados",
                            "Soporte prioritario",
                            "Marca blanca"
                        ));
                        break;
                }
                return planInfo;
            })
            .collect(Collectors.toList());

        return ResponseEntity.ok(plans);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSubscriptionById(@PathVariable Long id) {
        Optional<Subscription> subscription = subscriptionService.getSubscriptionById(id);
        if (subscription.isPresent()) {
            return ResponseEntity.ok(subscription.get());
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<Subscription> getSubscriptionByUsername(@PathVariable String username) {
        Subscription subscription = subscriptionService.getOrCreateSubscription(username);
        return ResponseEntity.ok(subscription);
    }

    @PostMapping
    public ResponseEntity<Subscription> createSubscription(@RequestBody Subscription subscription) {
        Subscription created = subscriptionService.createSubscription(subscription);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateSubscription(@PathVariable Long id, @RequestBody Subscription subscriptionDetails) {
        Optional<Subscription> updated = subscriptionService.updateSubscription(id, subscriptionDetails);
        if (updated.isPresent()) {
            return ResponseEntity.ok(updated.get());
        }
        return ResponseEntity.notFound().build();
    }

    @PatchMapping("/user/{username}/company")
    public ResponseEntity<?> updateCompanyInfo(
            @PathVariable String username,
            @RequestBody Map<String, String> body) {
        String companyName = body.get("companyName");
        String companyLogoUrl = body.get("companyLogoUrl");
        Optional<Subscription> updated = subscriptionService.updateCompanyInfo(username, companyName, companyLogoUrl);
        if (updated.isPresent()) {
            return ResponseEntity.ok(updated.get());
        }
        return ResponseEntity.notFound().build();
    }

    @PatchMapping("/user/{username}/upgrade")
    public ResponseEntity<?> upgradePlan(
            @PathVariable String username,
            @RequestParam PlanType plan) {
        Optional<Subscription> updated = subscriptionService.upgradePlan(username, plan);
        if (updated.isPresent()) {
            return ResponseEntity.ok(updated.get());
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSubscription(@PathVariable Long id) {
        if (subscriptionService.getSubscriptionById(id).isPresent()) {
            subscriptionService.deleteSubscription(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
