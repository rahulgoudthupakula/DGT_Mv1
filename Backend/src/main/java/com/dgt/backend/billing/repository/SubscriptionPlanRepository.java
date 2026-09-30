package com.dgt.backend.billing.repository;
import com.dgt.backend.billing.entity.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, Long> {}
