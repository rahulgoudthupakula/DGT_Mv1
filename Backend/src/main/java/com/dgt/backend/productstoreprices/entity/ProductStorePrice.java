package com.dgt.backend.productstoreprices.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "product_store_prices")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
// JPA mapping for product_store_prices; related record IDs are scalar fields rather than entity associations.
public class ProductStorePrice {

    // Database-generated primary key used by the repository.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "store_price_id")
    private Long storePriceId;

    @Column(name = "dgt_id", nullable = false, length = 50)
    private String dgtId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "retail_price", precision = 12, scale = 2)
    // Stored retail price uses two decimal places; effective group pricing is resolved elsewhere.
    private BigDecimal retailPrice;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "rebate_id")
    private Long rebateId;

    @Column(name = "created_at", updatable = false)
    // Hibernate populates this timestamp when the entity is first persisted.
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    // Hibernate refreshes this timestamp when the entity is updated.
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
