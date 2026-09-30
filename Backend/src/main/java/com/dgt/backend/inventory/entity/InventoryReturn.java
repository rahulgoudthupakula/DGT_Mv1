package com.dgt.backend.inventory.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.*;

@Entity
@Table(name = "inventory_returns")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InventoryReturn {

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
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
