package com.dgt.backend.products.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CreateNewArrivalRequest(
        Long invoiceItemId,
        @NotBlank @Size(max = 200) String productName,
        Long departmentId,
        Long storeSubDepartmentId,
        BigDecimal suggestedRetailPrice,
        Long statusId
) {}
