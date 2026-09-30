package com.dgt.backend.invoices.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "invoice_adjustments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InvoiceAdjustment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "invoice_adjustment_id")
    private Long invoiceAdjustmentId;

    @Column(name = "invoice_id", nullable = false)
    private Long invoiceId;

    @Column(name = "adjustment_type", nullable = false, length = 50)
    private String adjustmentType;

    @Column(name = "adjusted_amount", precision = 12, scale = 2)
    private BigDecimal adjustedAmount;

    @Column(name = "reason")
    private String reason;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
