package com.dgt.backend.inventory.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "inventory_return_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InventoryReturnItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "return_item_id")
    private Long returnItemId;

    @Column(name = "return_id", nullable = false)
    private Long returnId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "qty", precision = 12, scale = 3)
    private BigDecimal qty;

    @Column(name = "unit_cost", precision = 12, scale = 2)
    private BigDecimal unitCost;

    @Column(name = "reason")
    private String reason;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;
}
