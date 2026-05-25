package com.datanew.datanew.services;

import com.datanew.datanew.models.entities.Subscription;
import com.datanew.datanew.models.enums.PlanType;

import java.util.List;
import java.util.Optional;

public interface SubscriptionService {

    List<Subscription> getAllSubscriptions();

    Optional<Subscription> getSubscriptionById(Long id);

    Optional<Subscription> getSubscriptionByUsername(String username);

    Subscription getOrCreateSubscription(String username);

    Subscription createSubscription(Subscription subscription);

    Optional<Subscription> updateSubscription(Long id, Subscription subscriptionDetails);

    Optional<Subscription> updateCompanyInfo(String username, String companyName, String companyLogoUrl);

    Optional<Subscription> upgradePlan(String username, PlanType newPlan);

    List<Subscription> getSubscriptionsByPlan(PlanType planType);

    List<Subscription> getActiveSubscriptions();

    void deleteSubscription(Long id);

    boolean existsByUsername(String username);
}
