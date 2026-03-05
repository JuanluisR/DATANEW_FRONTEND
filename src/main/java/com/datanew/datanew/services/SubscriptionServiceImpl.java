package com.datanew.datanew.services;

import com.datanew.datanew.models.entities.Subscription;
import com.datanew.datanew.models.enums.PlanType;
import com.datanew.datanew.repositories.SubscriptionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class SubscriptionServiceImpl implements SubscriptionService {

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Override
    public List<Subscription> getAllSubscriptions() {
        return subscriptionRepository.findAll();
    }

    @Override
    public Optional<Subscription> getSubscriptionById(Long id) {
        return subscriptionRepository.findById(id);
    }

    @Override
    public Optional<Subscription> getSubscriptionByUsername(String username) {
        return subscriptionRepository.findByUsername(username);
    }

    @Override
    public Subscription getOrCreateSubscription(String username) {
        return subscriptionRepository.findByUsername(username).orElseGet(() -> {
            Subscription newSubscription = new Subscription();
            newSubscription.setUsername(username);
            newSubscription.setPlanType(PlanType.FREE);
            return subscriptionRepository.save(newSubscription);
        });
    }

    @Override
    public Subscription createSubscription(Subscription subscription) {
        return subscriptionRepository.save(subscription);
    }

    @Override
    public Optional<Subscription> updateSubscription(Long id, Subscription subscriptionDetails) {
        return subscriptionRepository.findById(id).map(subscription -> {
            if (subscriptionDetails.getPlanType() != null) {
                subscription.setPlanType(subscriptionDetails.getPlanType());
            }
            if (subscriptionDetails.getCompanyName() != null) {
                subscription.setCompanyName(subscriptionDetails.getCompanyName());
            }
            if (subscriptionDetails.getCompanyLogoUrl() != null) {
                subscription.setCompanyLogoUrl(subscriptionDetails.getCompanyLogoUrl());
            }
            if (subscriptionDetails.getIsActive() != null) {
                subscription.setIsActive(subscriptionDetails.getIsActive());
            }
            if (subscriptionDetails.getEndDate() != null) {
                subscription.setEndDate(subscriptionDetails.getEndDate());
            }
            return subscriptionRepository.save(subscription);
        });
    }

    @Override
    public Optional<Subscription> updateCompanyInfo(String username, String companyName, String companyLogoUrl) {
        return subscriptionRepository.findByUsername(username).map(subscription -> {
            subscription.setCompanyName(companyName);
            subscription.setCompanyLogoUrl(companyLogoUrl);
            return subscriptionRepository.save(subscription);
        });
    }

    @Override
    @Transactional
    public Optional<Subscription> upgradePlan(String username, PlanType newPlan) {
        return subscriptionRepository.findByUsername(username).map(subscription -> {
            subscription.setPlanType(newPlan);
            LocalDateTime now = LocalDateTime.now();
            subscription.setStartDate(now);
            if (newPlan != PlanType.FREE) {
                subscription.setEndDate(now.plusDays(subscription.getDataRetentionDays()));
            } else {
                subscription.setEndDate(null);
            }
            return subscriptionRepository.save(subscription);
        });
    }

    @Override
    public List<Subscription> getSubscriptionsByPlan(PlanType planType) {
        return subscriptionRepository.findByPlanType(planType);
    }

    @Override
    public List<Subscription> getActiveSubscriptions() {
        return subscriptionRepository.findByIsActiveTrue();
    }

    @Override
    public void deleteSubscription(Long id) {
        subscriptionRepository.deleteById(id);
    }

    @Override
    public boolean existsByUsername(String username) {
        return subscriptionRepository.existsByUsername(username);
    }
}
