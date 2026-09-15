package com.dgt.backend.identity.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.users; IDs and types follow the inspected database. */
public record User(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("user_id") Long userId,
        @JsonProperty("dgt_id") String dgtId,
        @JsonProperty("employee_id") String employeeId,
        @JsonProperty("first_name") String firstName,
        @JsonProperty("last_name") String lastName,
        @JsonProperty("email") String email,
        @com.fasterxml.jackson.annotation.JsonIgnore String passwordHash,
        @JsonProperty("account_status") String accountStatus,
        @JsonProperty("two_factor_authentication") Boolean twoFactorAuthentication,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static User fromRow(Map<String,Object> row) {
        return new User(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"user_id",Long.class),
            Rows.value(row,"dgt_id",String.class),
            Rows.value(row,"employee_id",String.class),
            Rows.value(row,"first_name",String.class),
            Rows.value(row,"last_name",String.class),
            Rows.value(row,"email",String.class),
            Rows.value(row,"password_hash",String.class),
            Rows.value(row,"account_status",String.class),
            Rows.value(row,"two_factor_authentication",Boolean.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
