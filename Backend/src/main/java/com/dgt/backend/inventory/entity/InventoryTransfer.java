package com.dgt.backend.inventory.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.*;

/**
 * JPA mapping of inventory_transfers.
 * Stores record fields and scalar relationship identifiers; workflow rules live outside this entity.
 */

@Entity
@Table(name = "inventory_transfers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InventoryTransfer {

    // Database-generated primary key.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transfer_id")
    private Long transferId;

    // Source and destination store identifiers for the transfer header.
    @Column(name = "from_dgt_id", nullable = false, length = 50)
    private String fromDgtId;

    @Column(name = "to_dgt_id", nullable = false, length = 50)
    private String toDgtId;

    @Column(name = "transfer_date")
    private OffsetDateTime transferDate;

    @Column(name = "status", length = 50)
    private String status;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at", updatable = false)
    // Hibernate supplies this timestamp when inserting the record.
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    // Hibernate maintains this timestamp on entity updates.
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
