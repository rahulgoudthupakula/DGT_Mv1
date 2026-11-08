package com.dgt.backend.productbarcodes.dto;

import jakarta.validation.constraints.Size;

// Partial-update payload: service code treats null fields as unchanged, including boxed Boolean flags.
public record UpdateProductBarcodeRequest(
        Long productId,
        @Size(max = 50) String productBarcodeType,
        // Keep barcode values as text so leading zeros are preserved.
        @Size(max = 200) String productBarcodeValue,
        Boolean isPrimary
) {}
