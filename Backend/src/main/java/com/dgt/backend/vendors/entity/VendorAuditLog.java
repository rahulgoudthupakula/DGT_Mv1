package com.dgt.backend.vendors.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.*;

@Entity
@Table(name = "vendor_audit_log")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
// JPA mapping for vendor_audit_log; related record IDs are scalar fields rather than entity associations.
public class VendorAuditLog {

    // Database-generated primary key used by the repository.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "audit_id")
    private Long auditId;

    @Column(name = "vendor_id", nullable = false)
    private Long vendorId;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "dgt_id", length = 50)
    private String dgtId;

    @Column(name = "action_type", length = 50)
    private String actionType;

    @Column(name = "details", columnDefinition = "text")
    private String details;

    @Column(name = "cost_history_id")
    private Long costHistoryId;

    @Column(name = "created_at", updatable = false)
    // Hibernate populates this timestamp when the entity is first persisted.
    @CreationTimestamp
    private OffsetDateTime createdAt;
}
