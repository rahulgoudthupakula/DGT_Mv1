package com.dgt.backend.billing.repository;
import com.dgt.backend.billing.entity.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data JPA persistence for SubscriptionPlan.
 * Inherits CRUD and pagination operations; no store-scoped query restriction is added here.
 */
public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, Long> {}
