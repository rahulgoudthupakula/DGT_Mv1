package com.dgt.backend.inventory.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal;
import java.time.*;

/**
 * JPA mapping of inventory_shrinkage_items.
 * Stores record fields and scalar relationship identifiers; workflow rules live outside this entity.
 */

@Entity
@Table(name = "inventory_shrinkage_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InventoryShrinkageItem {

    // Database-generated primary key.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "shrinkage_item_id")
    private Long shrinkageItemId;

    @Column(name = "shrinkage_id", nullable = false)
    private Long shrinkageId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "qty", precision = 12, scale = 3)
    private BigDecimal qty;

    @Column(name = "unit_cost", precision = 12, scale = 2)
    private BigDecimal unitCost;

    // Persisted loss amount; no formula is evaluated by this entity.
    @Column(name = "loss_amount", precision = 12, scale = 2)
    private BigDecimal lossAmount;

    @Column(name = "reason")
    private String reason;

    @Column(name = "created_at", updatable = false)
    // Hibernate supplies this timestamp when inserting the record.
    @CreationTimestamp
    private OffsetDateTime createdAt;
}
