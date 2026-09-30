package com.dgt.backend.sales.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "sales")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Sale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sale_id")
    private Long saleId;

    @Column(name = "store_id", nullable = false, length = 50)
    private String storeId;

    @Column(name = "cashier_id")
    private Long cashierId;

    @Column(name = "terminal_id")
    private Long terminalId;

    @Column(name = "receipt_no", length = 100)
    private String receiptNo;

    @Column(name = "transaction_id", length = 100)
    private String transactionId;

    @Column(name = "transaction_type", length = 50)
    private String transactionType;

    @Column(name = "sale_status", length = 50)
    private String saleStatus;

    @Column(name = "sale_datetime")
    private OffsetDateTime saleDatetime;

    @Column(name = "subtotal", precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "taxable_amount", precision = 12, scale = 2)
    private BigDecimal taxableAmount;

    @Column(name = "tax_amount", precision = 12, scale = 2)
    private BigDecimal taxAmount;

    @Column(name = "discount_amount", precision = 12, scale = 2)
    private BigDecimal discountAmount;

    @Column(name = "total_amount", precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "total_items")
    private Integer totalItems;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
