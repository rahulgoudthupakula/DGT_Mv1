package com.dgt.backend.invoices.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CreateGroceryInvoiceItemRequest(
        @NotNull Long invoiceId,
        Long productId,
        @Size(max = 100) String vendorItemCode,
        BigDecimal quantity,
        @Size(max = 50) String unitType,
        BigDecimal casePackQuantity,
        BigDecimal msrp,
        BigDecimal unitCost,
        BigDecimal itemLineDiscount,
        BigDecimal itemLineTotal,
        Boolean isProductNew
) {}
