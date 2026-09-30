package com.dgt.backend.productbarcodes.dto;

import jakarta.validation.constraints.Size;

public record UpdateProductBarcodeRequest(
        Long productId,
        @Size(max = 50) String productBarcodeType,
        @Size(max = 200) String productBarcodeValue,
        Boolean isPrimary
) {}
