package com.dgt.backend.invoices.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.invoice_audit_log; IDs and types follow the inspected database. */
public record InvoiceAuditLog(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("invoice_audit_log_id") Long invoiceAuditLogId,
        @JsonProperty("invoice_id") Long invoiceId,
        @JsonProperty("action_type") String actionType,
        @JsonProperty("action_by") Long actionBy,
        @JsonProperty("old_value") String oldValue,
        @JsonProperty("new_value") String newValue) {
    public static InvoiceAuditLog fromRow(Map<String,Object> row) {
        return new InvoiceAuditLog(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"invoice_audit_log_id",Long.class),
            Rows.value(row,"invoice_id",Long.class),
            Rows.value(row,"action_type",String.class),
            Rows.value(row,"action_by",Long.class),
            Rows.value(row,"old_value",String.class),
            Rows.value(row,"new_value",String.class));
    }
}
