package com.dgt.backend.inventory.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "inventory_reduction_requests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InventoryReductionRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reduction_request_id")
    private Long reductionRequestId;

    @Column(name = "dgt_id", nullable = false, length = 50)
    private String dgtId;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "request_type", length = 50)
    private String requestType;

    @Column(name = "quantity", precision = 12, scale = 3)
    private BigDecimal quantity;

    @Column(name = "reason")
    private String reason;

    @Column(name = "status", length = 50)
    private String status;

    @Column(name = "notes")
    private String notes;

    @Column(name = "destination", length = 100)
    private String destination;

    @Column(name = "requested_by")
    private Long requestedBy;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
