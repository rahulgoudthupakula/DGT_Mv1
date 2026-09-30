package com.dgt.backend.products.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "new_arrivals")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NewArrival {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "new_arrivals_id")
    private Long newArrivalsId;

    @Column(name = "invoice_item_id")
    private Long invoiceItemId;

    @Column(name = "product_name", nullable = false, length = 200)
    private String productName;

    @Column(name = "department_id")
    private Long departmentId;

    @Column(name = "store_sub_department_id")
    private Long storeSubDepartmentId;

    @Column(name = "suggested_retail_price", precision = 12, scale = 2)
    private BigDecimal suggestedRetailPrice;

    @Column(name = "status_id")
    private Long statusId;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
