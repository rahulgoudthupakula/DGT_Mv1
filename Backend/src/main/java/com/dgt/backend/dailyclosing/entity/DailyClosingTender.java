package com.dgt.backend.dailyclosing.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.daily_closing_tenders; IDs and types follow the inspected database. */
public record DailyClosingTender(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("tender_id") Long tenderId,
        @JsonProperty("everyday_closing_id") Long everydayClosingId,
        @JsonProperty("tender_type") String tenderType,
        @JsonProperty("expected_amount") BigDecimal expectedAmount,
        @JsonProperty("actual_amount") BigDecimal actualAmount,
        @JsonProperty("amount_difference") BigDecimal amountDifference,
        @JsonProperty("transaction_count") Integer transactionCount,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static DailyClosingTender fromRow(Map<String,Object> row) {
        return new DailyClosingTender(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"tender_id",Long.class),
            Rows.value(row,"everyday_closing_id",Long.class),
            Rows.value(row,"tender_type",String.class),
            Rows.value(row,"expected_amount",BigDecimal.class),
            Rows.value(row,"actual_amount",BigDecimal.class),
            Rows.value(row,"amount_difference",BigDecimal.class),
            Rows.value(row,"transaction_count",Integer.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
