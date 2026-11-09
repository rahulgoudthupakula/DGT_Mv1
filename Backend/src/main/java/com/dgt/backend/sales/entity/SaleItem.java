package com.dgt.backend.sales.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "sales_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
// JPA mapping for sales_items; related record IDs are scalar fields rather than entity associations.
public class SaleItem {

    // Database-generated primary key used by the repository.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sales_item_id")
    private Long salesItemId;

    @Column(name = "sale_id", nullable = false)
    private Long saleId;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "quantity", nullable = false, precision = 12, scale = 3)
    private BigDecimal quantity;

    @Column(name = "catalog_price", precision = 12, scale = 2)
    private BigDecimal catalogPrice;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "gross_amount", precision = 12, scale = 2)
    private BigDecimal grossAmount;

    @Column(name = "discount_amount", precision = 12, scale = 2)
    private BigDecimal discountAmount;

    @Column(name = "taxable_amount", precision = 12, scale = 2)
    private BigDecimal taxableAmount;

    @Column(name = "tax_amount", precision = 12, scale = 2)
    private BigDecimal taxAmount;

    @Column(name = "line_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal lineTotal;

    @Column(name = "created_at", updatable = false)
    // Hibernate populates this timestamp when the entity is first persisted.
    @CreationTimestamp
    private OffsetDateTime createdAt;
}
