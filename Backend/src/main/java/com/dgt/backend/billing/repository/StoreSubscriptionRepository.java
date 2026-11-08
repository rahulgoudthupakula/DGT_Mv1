package com.dgt.backend.billing.repository;
import com.dgt.backend.billing.entity.StoreSubscription;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data JPA persistence for StoreSubscription.
 * Inherits CRUD and pagination operations; no store-scoped query restriction is added here.
 */
public interface StoreSubscriptionRepository extends JpaRepository<StoreSubscription, Long> {}
