package com.dgt.backend.promotions.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.SQLRestriction;
import java.time.*;

@Entity
@Table(name = "promotion_products")
// Exclude archived links from ORM reads while retaining the stored relationship history.
@SQLRestriction("archived_at IS NULL")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
// JPA mapping for promotion_products; related record IDs are scalar fields rather than entity associations.
public class PromotionProduct {

    // Database-generated primary key used by the repository.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "promotion_product_id")
    private Long promotionProductId;

    @Column(name = "promotion_id", nullable = false)
    private Long promotionId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "archived_at")
    private OffsetDateTime archivedAt;

    @Column(name = "created_at", updatable = false)
    // Hibernate populates this timestamp when the entity is first persisted.
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    // Hibernate refreshes this timestamp when the entity is updated.
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
