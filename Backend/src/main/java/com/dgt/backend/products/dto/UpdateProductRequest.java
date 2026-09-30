package com.dgt.backend.products.dto;

import jakarta.validation.constraints.Size;

public record UpdateProductRequest(
        Long storeSubDepartmentId,
        @Size(max = 200) String productName,
        @Size(max = 100) String productSku,
        Boolean isReturnable,
        Long brandId,
        @Size(max = 50) String unitOfMeasure,
        Boolean isActive,
        Boolean isTaxable,
        Boolean isEbt
) {}
