package com.dgt.backend.invoices.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record CreateInvoiceRequest(
        @NotBlank @Size(max = 50) String dgtId,
        @NotNull Long vendorId,
        @Size(max = 100) String invoiceNumber,
        @NotBlank @Size(max = 50) String invoiceType,
        @NotNull LocalDate invoiceDate,
        LocalDate receivedDate,
        LocalDate dueDate,
        Long receivedBy,
        Long approvedBy,
        OffsetDateTime approvedAt,
        Long purchaseOrderId
) {}
