package com.dgt.backend.inventory.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.*;

@Entity
@Table(name = "inventory_transfers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InventoryTransfer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transfer_id")
    private Long transferId;

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
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
