package com.dgt.backend.sales.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "sale_payments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
// JPA mapping for sale_payments; related record IDs are scalar fields rather than entity associations.
public class SalePayment {

    // Database-generated primary key used by the repository.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sale_payment_id")
    private Long salePaymentId;

    @Column(name = "sale_id", nullable = false)
    private Long saleId;

    @Column(name = "tender_type_id")
    private Long tenderTypeId;

    @Column(name = "payment_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal paymentAmount;

    @Column(name = "payment_status", length = 50)
    private String paymentStatus;

    @Column(name = "card_brand", length = 50)
    private String cardBrand;

    @Column(name = "card_last4", length = 10)
    private String cardLast4;

    @Column(name = "processor_reference", length = 100)
    private String processorReference;

    @Column(name = "authorization_code", length = 100)
    private String authorizationCode;

    @Column(name = "payment_datetime")
    private OffsetDateTime paymentDatetime;

    @Column(name = "created_at", updatable = false)
    // Hibernate populates this timestamp when the entity is first persisted.
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    // Hibernate refreshes this timestamp when the entity is updated.
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
