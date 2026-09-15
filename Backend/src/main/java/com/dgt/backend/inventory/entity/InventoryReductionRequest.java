package com.dgt.backend.inventory.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.inventory_reduction_requests; IDs and types follow the inspected database. */
public record InventoryReductionRequest(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("reduction_request_id") Long reductionRequestId,
        @JsonProperty("dgt_id") String dgtId,
        @JsonProperty("product_id") Long productId,
        @JsonProperty("request_type") String requestType,
        @JsonProperty("quantity") BigDecimal quantity,
        @JsonProperty("reason") String reason,
        @JsonProperty("status") String status,
        @JsonProperty("notes") String notes,
        @JsonProperty("destination") String destination,
        @JsonProperty("requested_by") Long requestedBy,
        @JsonProperty("rejection_reason") String rejectionReason,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static InventoryReductionRequest fromRow(Map<String,Object> row) {
        return new InventoryReductionRequest(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"reduction_request_id",Long.class),
            Rows.value(row,"dgt_id",String.class),
            Rows.value(row,"product_id",Long.class),
            Rows.value(row,"request_type",String.class),
            Rows.value(row,"quantity",BigDecimal.class),
            Rows.value(row,"reason",String.class),
            Rows.value(row,"status",String.class),
            Rows.value(row,"notes",String.class),
            Rows.value(row,"destination",String.class),
            Rows.value(row,"requested_by",Long.class),
            Rows.value(row,"rejection_reason",String.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
