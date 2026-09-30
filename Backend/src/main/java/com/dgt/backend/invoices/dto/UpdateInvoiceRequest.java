package com.dgt.backend.invoices.dto;

import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record UpdateInvoiceRequest(
        @Size(max = 50) String dgtId,
        Long vendorId,
        @Size(max = 100) String invoiceNumber,
        @Size(max = 50) String invoiceType,
        LocalDate invoiceDate,
        LocalDate receivedDate,
        LocalDate dueDate,
        Long receivedBy,
        Long approvedBy,
        OffsetDateTime approvedAt,
        Long purchaseOrderId
) {}
