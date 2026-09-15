package com.dgt.backend.vendors.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.vendor_item_cost_history; IDs and types follow the inspected database. */
public record VendorItemCostHistory(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("cost_history_id") Long costHistoryId,
        @JsonProperty("product_id") Long productId,
        @JsonProperty("vendor_id") Long vendorId,
        @JsonProperty("old_cost") BigDecimal oldCost,
        @JsonProperty("new_cost") BigDecimal newCost,
        @JsonProperty("change_percentage") BigDecimal changePercentage,
        @JsonProperty("effective_date") LocalDate effectiveDate,
        @JsonProperty("change_source") String changeSource,
        @JsonProperty("changed_by") Long changedBy,
        @JsonProperty("created_date") OffsetDateTime createdDate,
        @JsonProperty("updated_date") OffsetDateTime updatedDate) {
    public static VendorItemCostHistory fromRow(Map<String,Object> row) {
        return new VendorItemCostHistory(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"cost_history_id",Long.class),
            Rows.value(row,"product_id",Long.class),
            Rows.value(row,"vendor_id",Long.class),
            Rows.value(row,"old_cost",BigDecimal.class),
            Rows.value(row,"new_cost",BigDecimal.class),
            Rows.value(row,"change_percentage",BigDecimal.class),
            Rows.value(row,"effective_date",LocalDate.class),
            Rows.value(row,"change_source",String.class),
            Rows.value(row,"changed_by",Long.class),
            Rows.value(row,"created_date",OffsetDateTime.class),
            Rows.value(row,"updated_date",OffsetDateTime.class));
    }
}
