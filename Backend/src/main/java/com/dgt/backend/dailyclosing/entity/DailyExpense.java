package com.dgt.backend.dailyclosing.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.daily_expenses; IDs and types follow the inspected database. */
public record DailyExpense(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("expenses_id") Long expensesId,
        @JsonProperty("everyday_closing_id") Long everydayClosingId,
        @JsonProperty("expenses_date") LocalDate expensesDate,
        @JsonProperty("expenses_type") String expensesType,
        @JsonProperty("description") String description,
        @JsonProperty("amount") BigDecimal amount,
        @JsonProperty("paid_by") Long paidBy,
        @JsonProperty("receipt_number") String receiptNumber,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static DailyExpense fromRow(Map<String,Object> row) {
        return new DailyExpense(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"expenses_id",Long.class),
            Rows.value(row,"everyday_closing_id",Long.class),
            Rows.value(row,"expenses_date",LocalDate.class),
            Rows.value(row,"expenses_type",String.class),
            Rows.value(row,"description",String.class),
            Rows.value(row,"amount",BigDecimal.class),
            Rows.value(row,"paid_by",Long.class),
            Rows.value(row,"receipt_number",String.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
