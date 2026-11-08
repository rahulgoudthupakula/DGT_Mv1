package com.dgt.backend.productvendors.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.SQLRestriction;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "product_vendors")
// Exclude archived links from ORM reads while retaining the stored relationship history.
@SQLRestriction("archived_at IS NULL")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
// JPA mapping for product_vendors; related record IDs are scalar fields rather than entity associations.
public class ProductVendor {

    // Database-generated primary key used by the repository.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_vendor_id")
    private Long productVendorId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "vendor_id", nullable = false)
    private Long vendorId;

    @Column(name = "vendor_sku", length = 100)
    private String vendorSku;

    @Column(name = "unit_type", length = 50)
    private String unitType;

    @Column(name = "unit_of_measure", length = 50)
    private String unitOfMeasure;

    @Column(name = "unit_cost", precision = 12, scale = 4)
    // Persist vendor cost as a decimal with four fractional digits, as defined by the column mapping.
    private BigDecimal unitCost;

    @Column(name = "is_primary")
    private Boolean isPrimary;

    @Column(name = "archived_at")
    private OffsetDateTime archivedAt;

    @Column(name = "created_at", updatable = false)
    // Hibernate populates this timestamp when the entity is first persisted.
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    // Hibernate refreshes this timestamp when the entity is updated.
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
