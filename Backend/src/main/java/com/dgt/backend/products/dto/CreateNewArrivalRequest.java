package com.dgt.backend.products.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

// Creation payload for the generic new-arrival API; declared constraints run when validated by the controller.
public record CreateNewArrivalRequest(
        Long invoiceItemId,
        @NotBlank @Size(max = 200) String productName,
        Long departmentId,
        Long storeSubDepartmentId,
        BigDecimal suggestedRetailPrice,
        Long statusId
) {}
