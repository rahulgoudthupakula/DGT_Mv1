package com.dgt.backend.productbarcodes.dto;

import com.dgt.backend.productbarcodes.entity.ProductBarcode;
import java.time.OffsetDateTime;

// Response projection for the product barcode record, including database identity and lifecycle timestamps.
public record ProductBarcodeResponse(
        Long productBarcodeId,
        Long productId,
        String productBarcodeType,
        // Keep barcode values as text so leading zeros are preserved.
        String productBarcodeValue,
        Boolean isPrimary,
        OffsetDateTime archivedAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    // Copy entity fields into the response without exposing the persistence object itself.
    public static ProductBarcodeResponse from(ProductBarcode e) {
        return new ProductBarcodeResponse(
                e.getProductBarcodeId(), e.getProductId(), e.getProductBarcodeType(),
                e.getProductBarcodeValue(), e.getIsPrimary(), e.getArchivedAt(),
                e.getCreatedAt(), e.getUpdatedAt());
    }
}
