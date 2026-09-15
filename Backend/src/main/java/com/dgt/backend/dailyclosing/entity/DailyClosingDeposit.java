package com.dgt.backend.dailyclosing.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.daily_closing_deposits; IDs and types follow the inspected database. */
public record DailyClosingDeposit(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("deposit_id") Long depositId,
        @JsonProperty("everyday_closing_id") Long everydayClosingId,
        @JsonProperty("deposit_date") LocalDate depositDate,
        @JsonProperty("bank_account_id") Long bankAccountId,
        @JsonProperty("amount") BigDecimal amount,
        @JsonProperty("receipt_url") String receiptUrl,
        @JsonProperty("deposited_by") Long depositedBy,
        @JsonProperty("status") String status,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static DailyClosingDeposit fromRow(Map<String,Object> row) {
        return new DailyClosingDeposit(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"deposit_id",Long.class),
            Rows.value(row,"everyday_closing_id",Long.class),
            Rows.value(row,"deposit_date",LocalDate.class),
            Rows.value(row,"bank_account_id",Long.class),
            Rows.value(row,"amount",BigDecimal.class),
            Rows.value(row,"receipt_url",String.class),
            Rows.value(row,"deposited_by",Long.class),
            Rows.value(row,"status",String.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
