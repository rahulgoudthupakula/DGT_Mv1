package com.dgt.backend.productbarcodes.dto;

import com.dgt.backend.productbarcodes.entity.ProductBarcode;
import java.time.OffsetDateTime;

public record ProductBarcodeResponse(
        Long productBarcodeId,
        Long productId,
        String productBarcodeType,
        String productBarcodeValue,
        Boolean isPrimary,
        OffsetDateTime archivedAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static ProductBarcodeResponse from(ProductBarcode e) {
        return new ProductBarcodeResponse(
                e.getProductBarcodeId(), e.getProductId(), e.getProductBarcodeType(),
                e.getProductBarcodeValue(), e.getIsPrimary(), e.getArchivedAt(),
                e.getCreatedAt(), e.getUpdatedAt());
    }
}
