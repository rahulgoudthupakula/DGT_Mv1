package com.dgt.backend.inventory.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.*;

/**
 * JPA mapping of inventory_returns.
 * Stores record fields and scalar relationship identifiers; workflow rules live outside this entity.
 */

@Entity
@Table(name = "inventory_returns")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InventoryReturn {

    // Database-generated primary key.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "return_id")
    private Long returnId;

    @Column(name = "dgt_id", nullable = false, length = 50)
    private String dgtId;

    @Column(name = "vendor_id")
    private Long vendorId;

    @Column(name = "return_type", length = 50)
    private String returnType;

    @Column(name = "reference_number", length = 100)
    private String referenceNumber;

    @Column(name = "status", length = 50)
    private String status;

    @Column(name = "created_at", updatable = false)
    // Hibernate supplies this timestamp when inserting the record.
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    // Hibernate maintains this timestamp on entity updates.
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
