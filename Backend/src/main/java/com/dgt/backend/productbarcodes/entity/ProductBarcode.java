package com.dgt.backend.productbarcodes.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.SQLRestriction;
import java.time.*;

@Entity
@Table(name = "product_barcodes")
// Exclude archived barcode rows from ORM reads while retaining their stored history.
@SQLRestriction("archived_at IS NULL")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
// JPA mapping for product_barcodes; related record IDs are scalar fields rather than entity associations.
public class ProductBarcode {

    // Database-generated primary key used by the repository.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_barcode_id")
    private Long productBarcodeId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "product_barcode_type", length = 50)
    private String productBarcodeType;

    @Column(name = "product_barcode_value", nullable = false, length = 200)
    // Store barcode text without numeric conversion or loss of leading zeros.
    private String productBarcodeValue;

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
