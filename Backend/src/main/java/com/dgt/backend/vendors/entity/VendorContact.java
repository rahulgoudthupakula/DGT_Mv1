package com.dgt.backend.vendors.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.vendor_contacts; IDs and types follow the inspected database. */
public record VendorContact(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("contact_id") Long contactId,
        @JsonProperty("vendor_id") Long vendorId,
        @JsonProperty("dgt_id") String dgtId,
        @JsonProperty("contract_number") String contractNumber,
        @JsonProperty("start_date") LocalDate startDate,
        @JsonProperty("end_date") LocalDate endDate,
        @JsonProperty("volume_threshold") BigDecimal volumeThreshold,
        @JsonProperty("volume_discount_value") BigDecimal volumeDiscountValue,
        @JsonProperty("volume_discount_type") String volumeDiscountType,
        @JsonProperty("return_window_days") Integer returnWindowDays,
        @JsonProperty("status") String status,
        @JsonProperty("document_url") String documentUrl,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt,
        @JsonProperty("force_end_date") LocalDate forceEndDate) {
    public static VendorContact fromRow(Map<String,Object> row) {
        return new VendorContact(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"contact_id",Long.class),
            Rows.value(row,"vendor_id",Long.class),
            Rows.value(row,"dgt_id",String.class),
            Rows.value(row,"contract_number",String.class),
            Rows.value(row,"start_date",LocalDate.class),
            Rows.value(row,"end_date",LocalDate.class),
            Rows.value(row,"volume_threshold",BigDecimal.class),
            Rows.value(row,"volume_discount_value",BigDecimal.class),
            Rows.value(row,"volume_discount_type",String.class),
            Rows.value(row,"return_window_days",Integer.class),
            Rows.value(row,"status",String.class),
            Rows.value(row,"document_url",String.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class),
            Rows.value(row,"force_end_date",LocalDate.class));
    }
}
