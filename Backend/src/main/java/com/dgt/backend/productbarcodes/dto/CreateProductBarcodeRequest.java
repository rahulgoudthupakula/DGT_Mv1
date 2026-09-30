package com.dgt.backend.productbarcodes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateProductBarcodeRequest(
        @NotNull Long productId,
        @Size(max = 50) String productBarcodeType,
        @NotBlank @Size(max = 200) String productBarcodeValue,
        Boolean isPrimary
) {}
