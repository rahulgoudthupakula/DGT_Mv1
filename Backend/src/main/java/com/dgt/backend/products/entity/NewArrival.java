package com.dgt.backend.products.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.new_arrivals; IDs and types follow the inspected database. */
public record NewArrival(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("new_arrivals_id") Long newArrivalsId,
        @JsonProperty("invoice_item_id") Long invoiceItemId,
        @JsonProperty("product_name") String productName,
        @JsonProperty("department_id") Long departmentId,
        @JsonProperty("store_sub_department_id") Long storeSubDepartmentId,
        @JsonProperty("suggested_retail_price") BigDecimal suggestedRetailPrice,
        @JsonProperty("status_id") Long statusId,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static NewArrival fromRow(Map<String,Object> row) {
        return new NewArrival(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"new_arrivals_id",Long.class),
            Rows.value(row,"invoice_item_id",Long.class),
            Rows.value(row,"product_name",String.class),
            Rows.value(row,"department_id",Long.class),
            Rows.value(row,"store_sub_department_id",Long.class),
            Rows.value(row,"suggested_retail_price",BigDecimal.class),
            Rows.value(row,"status_id",Long.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
