package com.dgt.backend.invoices.dto;

import com.dgt.backend.invoices.entity.InvoiceAuditLog;

public record InvoiceAuditLogResponse(
        Long invoiceAuditLogId,
        Long invoiceId,
        String actionType,
        Long actionBy,
        String oldValue,
        String newValue
) {
    public static InvoiceAuditLogResponse from(InvoiceAuditLog e) {
        return new InvoiceAuditLogResponse(
                e.getInvoiceAuditLogId(), e.getInvoiceId(), e.getActionType(),
                e.getActionBy(), e.getOldValue(), e.getNewValue());
    }
}
