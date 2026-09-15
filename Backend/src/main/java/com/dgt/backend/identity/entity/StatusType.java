package com.dgt.backend.identity.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.status_types; IDs and types follow the inspected database. */
public record StatusType(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("status_type_id") Long statusTypeId,
        @JsonProperty("status_name") String statusName) {
    public static StatusType fromRow(Map<String,Object> row) {
        return new StatusType(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"status_type_id",Long.class),
            Rows.value(row,"status_name",String.class));
    }
}
