package com.dgt.backend.products.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.*;

@Entity
@Table(name = "products")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
// JPA mapping for products; related record IDs are scalar fields rather than entity associations.
public class Product {

    // Database-generated primary key used by the repository.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_id")
    private Long productId;

    @Column(name = "store_sub_department_id")
    private Long storeSubDepartmentId;

    @Column(name = "product_name", nullable = false, length = 200)
    private String productName;

    @Column(name = "product_sku", length = 100)
    private String productSku;

    @Column(name = "is_returnable")
    private Boolean isReturnable;

    @Column(name = "brand_id")
    private Long brandId;

    @Column(name = "unit_of_measure", length = 50)
    private String unitOfMeasure;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "is_taxable")
    private Boolean isTaxable;

    @Column(name = "is_ebt")
    private Boolean isEbt;

    @Column(name = "created_at", updatable = false)
    // Hibernate populates this timestamp when the entity is first persisted.
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    // Hibernate refreshes this timestamp when the entity is updated.
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
