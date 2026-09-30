package com.dgt.backend.invoices.dto;

import com.dgt.backend.invoices.entity.Invoice;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record InvoiceResponse(
        Long invoiceId,
        String dgtId,
        Long vendorId,
        String invoiceNumber,
        String invoiceType,
        LocalDate invoiceDate,
        LocalDate receivedDate,
        LocalDate dueDate,
        Long receivedBy,
        Long approvedBy,
        OffsetDateTime approvedAt,
        Long purchaseOrderId
) {
    public static InvoiceResponse from(Invoice e) {
        return new InvoiceResponse(
                e.getInvoiceId(), e.getDgtId(), e.getVendorId(),
                e.getInvoiceNumber(), e.getInvoiceType(), e.getInvoiceDate(),
                e.getReceivedDate(), e.getDueDate(), e.getReceivedBy(),
                e.getApprovedBy(), e.getApprovedAt(), e.getPurchaseOrderId());
    }
}
