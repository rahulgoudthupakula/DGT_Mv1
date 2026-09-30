package com.dgt.backend.invoices.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.SQLRestriction;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "grocery_invoice_items")
@SQLRestriction("archived_at IS NULL")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GroceryInvoiceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "grocery_invoice_item_id")
    private Long groceryInvoiceItemId;

    @Column(name = "invoice_id", nullable = false)
    private Long invoiceId;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "vendor_item_code", length = 100)
    private String vendorItemCode;

    @Column(name = "quantity", precision = 12, scale = 3)
    private BigDecimal quantity;

    @Column(name = "unit_type", length = 50)
    private String unitType;

    @Column(name = "case_pack_quantity", precision = 12, scale = 3)
    private BigDecimal casePackQuantity;

    @Column(name = "msrp", precision = 12, scale = 2)
    private BigDecimal msrp;

    @Column(name = "unit_cost", precision = 12, scale = 4)
    private BigDecimal unitCost;

    @Column(name = "item_line_discount", precision = 12, scale = 2)
    private BigDecimal itemLineDiscount;

    @Column(name = "item_line_total", precision = 12, scale = 2)
    private BigDecimal itemLineTotal;

    @Column(name = "is_product_new")
    private Boolean isProductNew;

    @Column(name = "archived_at")
    private OffsetDateTime archivedAt;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
