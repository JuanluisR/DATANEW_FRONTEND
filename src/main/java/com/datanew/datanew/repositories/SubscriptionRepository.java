package com.datanew.datanew.repositories;

import com.datanew.datanew.models.entities.Subscription;
import com.datanew.datanew.models.enums.PlanType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    Optional<Subscription> findByUsername(String username);

    List<Subscription> findByPlanType(PlanType planType);

    List<Subscription> findByIsActiveTrue();

    boolean existsByUsername(String username);
}
