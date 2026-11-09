package com.dgt.backend.billing.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.*;

/**
 * JPA mapping of store_subscriptions for the generic record API.
 * Database identifiers are stored as scalar values rather than JPA relationship objects.
 */

@Entity
@Table(name = "store_subscriptions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StoreSubscription {

    // Database-generated primary key.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "subscription_id")
    private Long subscriptionId;

    @Column(name = "store_id", nullable = false, length = 50)
    private String storeId;

    @Column(name = "subscription_plan_id", nullable = false)
    private Long subscriptionPlanId;

    @Column(name = "subscription_status", nullable = false, length = 50)
    private String subscriptionStatus;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "current_period_start")
    private LocalDate currentPeriodStart;

    @Column(name = "current_period_end")
    private LocalDate currentPeriodEnd;

    @Column(name = "next_billing_date")
    private LocalDate nextBillingDate;

    @Column(name = "auto_renewal")
    private Boolean autoRenewal;

    @Column(name = "cancelled_at")
    private OffsetDateTime cancelledAt;

    @Column(name = "created_at", updatable = false)
    // Hibernate records the creation timestamp when the entity is inserted.
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    // Hibernate maintains the timestamp when the entity is updated.
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
