package com.dgt.backend.invoices.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "invoice_charges")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InvoiceCharge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "invoice_charge_id")
    private Long invoiceChargeId;

    @Column(name = "invoice_id", nullable = false)
    private Long invoiceId;

    @Column(name = "charge_type", nullable = false, length = 50)
    private String chargeType;

    @Column(name = "sub_total", precision = 12, scale = 2)
    private BigDecimal subTotal;

    @Column(name = "discounted_amount", precision = 12, scale = 2)
    private BigDecimal discountedAmount;

    @Column(name = "other_charges", precision = 12, scale = 2)
    private BigDecimal otherCharges;

    @Column(name = "total_amount", precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "status_id")
    private Long statusId;

    @Column(name = "payment_status", length = 50)
    private String paymentStatus;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
