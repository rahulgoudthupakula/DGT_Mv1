package com.dgt.backend.inventorymovements.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "inventory_movements")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InventoryMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "movement_id")
    private Long movementId;

    @Column(name = "dgt_id", nullable = false, length = 50)
    private String dgtId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "movement_type", nullable = false, length = 50)
    private String movementType;

    @Column(name = "qty_changed", precision = 12, scale = 3)
    private BigDecimal qtyChanged;

    @Column(name = "unit_cost", precision = 12, scale = 2)
    private BigDecimal unitCost;

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
