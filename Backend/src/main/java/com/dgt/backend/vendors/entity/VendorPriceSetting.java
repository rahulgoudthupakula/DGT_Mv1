package com.dgt.backend.vendors.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.vendor_price_settings; IDs and types follow the inspected database. */
public record VendorPriceSetting(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("setting_id") Long settingId,
        @JsonProperty("dgt_id") String dgtId,
        @JsonProperty("price_change_alert_enabled") Boolean priceChangeAlertEnabled,
        @JsonProperty("alert_threshold_percentage") BigDecimal alertThresholdPercentage,
        @JsonProperty("approval_required") Boolean approvalRequired,
        @JsonProperty("permission_id") Long permissionId,
        @JsonProperty("approval_threshold_percentage") BigDecimal approvalThresholdPercentage,
        @JsonProperty("auto_pick_preferred_vendor") Boolean autoPickPreferredVendor,
        @JsonProperty("use_fallback_vendor") Boolean useFallbackVendor,
        @JsonProperty("consider_lead_time") Boolean considerLeadTime,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static VendorPriceSetting fromRow(Map<String,Object> row) {
        return new VendorPriceSetting(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"setting_id",Long.class),
            Rows.value(row,"dgt_id",String.class),
            Rows.value(row,"price_change_alert_enabled",Boolean.class),
            Rows.value(row,"alert_threshold_percentage",BigDecimal.class),
            Rows.value(row,"approval_required",Boolean.class),
            Rows.value(row,"permission_id",Long.class),
            Rows.value(row,"approval_threshold_percentage",BigDecimal.class),
            Rows.value(row,"auto_pick_preferred_vendor",Boolean.class),
            Rows.value(row,"use_fallback_vendor",Boolean.class),
            Rows.value(row,"consider_lead_time",Boolean.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
