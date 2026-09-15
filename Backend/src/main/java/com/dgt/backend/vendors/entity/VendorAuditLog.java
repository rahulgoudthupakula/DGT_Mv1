package com.dgt.backend.vendors.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.vendor_audit_log; IDs and types follow the inspected database. */
public record VendorAuditLog(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("audit_id") Long auditId,
        @JsonProperty("vendor_id") Long vendorId,
        @JsonProperty("product_id") Long productId,
        @JsonProperty("dgt_id") String dgtId,
        @JsonProperty("action_type") String actionType,
        @JsonProperty("details") String details,
        @JsonProperty("cost_history_id") Long costHistoryId,
        @JsonProperty("created_at") OffsetDateTime createdAt) {
    public static VendorAuditLog fromRow(Map<String,Object> row) {
        return new VendorAuditLog(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"audit_id",Long.class),
            Rows.value(row,"vendor_id",Long.class),
            Rows.value(row,"product_id",Long.class),
            Rows.value(row,"dgt_id",String.class),
            Rows.value(row,"action_type",String.class),
            Rows.value(row,"details",String.class),
            Rows.value(row,"cost_history_id",Long.class),
            Rows.value(row,"created_at",OffsetDateTime.class));
    }
}
