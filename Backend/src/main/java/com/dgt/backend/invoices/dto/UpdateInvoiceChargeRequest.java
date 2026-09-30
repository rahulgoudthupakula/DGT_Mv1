package com.dgt.backend.invoices.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record UpdateInvoiceChargeRequest(
        Long invoiceId,
        @Size(max = 50) String chargeType,
        BigDecimal subTotal,
        BigDecimal discountedAmount,
        BigDecimal otherCharges,
        BigDecimal totalAmount,
        Long statusId,
        @Size(max = 50) String paymentStatus
) {}
