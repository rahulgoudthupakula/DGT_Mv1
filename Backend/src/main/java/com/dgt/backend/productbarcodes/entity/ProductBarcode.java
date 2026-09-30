package com.dgt.backend.productbarcodes.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.SQLRestriction;
import java.time.*;

@Entity
@Table(name = "product_barcodes")
@SQLRestriction("archived_at IS NULL")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductBarcode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_barcode_id")
    private Long productBarcodeId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "product_barcode_type", length = 50)
    private String productBarcodeType;

    @Column(name = "product_barcode_value", nullable = false, length = 200)
    private String productBarcodeValue;

    @Column(name = "is_primary")
    private Boolean isPrimary;

    @Column(name = "archived_at")
    private OffsetDateTime archivedAt;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
