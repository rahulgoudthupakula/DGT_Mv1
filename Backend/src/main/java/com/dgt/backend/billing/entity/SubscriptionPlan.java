package com.dgt.backend.billing.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.*;

/**
 * JPA mapping of subscription_plans for the generic record API.
 * Database identifiers are stored as scalar values rather than JPA relationship objects.
 */

@Entity
@Table(name = "subscription_plans")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SubscriptionPlan {

    // Database-generated primary key.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "subscription_plan_id")
    private Long subscriptionPlanId;

    @Column(name = "plan_name", nullable = false, length = 100)
    private String planName;

    // Decimal money is persisted with two fractional digits.
    @Column(name = "monthly_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal monthlyPrice;

    @Column(name = "created_at", updatable = false)
    // Hibernate records the creation timestamp when the entity is inserted.
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    // Hibernate maintains the timestamp when the entity is updated.
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
