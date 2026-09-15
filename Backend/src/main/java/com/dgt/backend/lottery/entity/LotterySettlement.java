package com.dgt.backend.lottery.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.lottery_settlements; IDs and types follow the inspected database. */
public record LotterySettlement(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("lottery_settlement_id") Long lotterySettlementId,
        @JsonProperty("dgt_id") String dgtId,
        @JsonProperty("vendor_id") Long vendorId,
        @JsonProperty("settlement_reference") String settlementReference,
        @JsonProperty("period_type") JsonNode periodType,
        @JsonProperty("period_start_date") LocalDate periodStartDate,
        @JsonProperty("period_end_date") LocalDate periodEndDate,
        @JsonProperty("total_sales") BigDecimal totalSales,
        @JsonProperty("total_commission") BigDecimal totalCommission,
        @JsonProperty("status_type_id") Long statusTypeId,
        @JsonProperty("created_by") Long createdBy,
        @JsonProperty("paid_at") OffsetDateTime paidAt,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static LotterySettlement fromRow(Map<String,Object> row) {
        return new LotterySettlement(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"lottery_settlement_id",Long.class),
            Rows.value(row,"dgt_id",String.class),
            Rows.value(row,"vendor_id",Long.class),
            Rows.value(row,"settlement_reference",String.class),
            Rows.value(row,"period_type",JsonNode.class),
            Rows.value(row,"period_start_date",LocalDate.class),
            Rows.value(row,"period_end_date",LocalDate.class),
            Rows.value(row,"total_sales",BigDecimal.class),
            Rows.value(row,"total_commission",BigDecimal.class),
            Rows.value(row,"status_type_id",Long.class),
            Rows.value(row,"created_by",Long.class),
            Rows.value(row,"paid_at",OffsetDateTime.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
