package com.dgt.backend.productbarcodes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// Creation payload for the generic product barcode API; declared constraints run when validated by the controller.
public record CreateProductBarcodeRequest(
        @NotNull Long productId,
        @Size(max = 50) String productBarcodeType,
        // Keep barcode values as text so leading zeros are preserved.
        @NotBlank @Size(max = 200) String productBarcodeValue,
        Boolean isPrimary
) {}
