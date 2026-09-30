package com.dgt.backend.invoices.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CreateInvoiceChargeRequest(
        @NotNull Long invoiceId,
        @NotBlank @Size(max = 50) String chargeType,
        BigDecimal subTotal,
        BigDecimal discountedAmount,
        BigDecimal otherCharges,
        BigDecimal totalAmount,
        Long statusId,
        @Size(max = 50) String paymentStatus
) {}
