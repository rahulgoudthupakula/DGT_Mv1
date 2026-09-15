package com.dgt.backend.invoices.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.invoice_documents; IDs and types follow the inspected database. */
public record InvoiceDocument(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("invoice_document_id") Long invoiceDocumentId,
        @JsonProperty("invoice_id") Long invoiceId,
        @JsonProperty("document_type") String documentType,
        @JsonProperty("file_name") String fileName,
        @JsonProperty("file_url") String fileUrl,
        @JsonProperty("uploaded_by") Long uploadedBy,
        @JsonProperty("uploaded_at") OffsetDateTime uploadedAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static InvoiceDocument fromRow(Map<String,Object> row) {
        return new InvoiceDocument(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"invoice_document_id",Long.class),
            Rows.value(row,"invoice_id",Long.class),
            Rows.value(row,"document_type",String.class),
            Rows.value(row,"file_name",String.class),
            Rows.value(row,"file_url",String.class),
            Rows.value(row,"uploaded_by",Long.class),
            Rows.value(row,"uploaded_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
