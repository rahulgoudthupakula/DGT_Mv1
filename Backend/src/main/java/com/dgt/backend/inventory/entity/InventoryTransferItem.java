package com.dgt.backend.inventory.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal;
import java.time.*;

/**
 * JPA mapping of inventory_transfer_items.
 * Stores record fields and scalar relationship identifiers; workflow rules live outside this entity.
 */

@Entity
@Table(name = "inventory_transfer_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InventoryTransferItem {

    // Database-generated primary key.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transfer_item_id")
    private Long transferItemId;

    @Column(name = "transfer_id", nullable = false)
    private Long transferId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    // Sent and received quantities are stored separately to retain transfer discrepancies.
    @Column(name = "qty_sent", precision = 12, scale = 3)
    private BigDecimal qtySent;

    @Column(name = "qty_received", precision = 12, scale = 3)
    private BigDecimal qtyReceived;

    @Column(name = "unit_cost", precision = 12, scale = 2)
    private BigDecimal unitCost;

    @Column(name = "created_at", updatable = false)
    // Hibernate supplies this timestamp when inserting the record.
    @CreationTimestamp
    private OffsetDateTime createdAt;
}
