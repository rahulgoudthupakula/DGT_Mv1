package com.dgt.backend.dailyclosing.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.everyday_closing; IDs and types follow the inspected database. */
public record EverydayClosing(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("everyday_closing_id") Long everydayClosingId,
        @JsonProperty("dgt_id") String dgtId,
        @JsonProperty("opening_datetime") OffsetDateTime openingDatetime,
        @JsonProperty("closing_datetime") OffsetDateTime closingDatetime,
        @JsonProperty("total_gross_sales") BigDecimal totalGrossSales,
        @JsonProperty("total_discounts") BigDecimal totalDiscounts,
        @JsonProperty("total_tax") BigDecimal totalTax,
        @JsonProperty("total_net_sales") BigDecimal totalNetSales,
        @JsonProperty("total_refunds") BigDecimal totalRefunds,
        @JsonProperty("expected_cash") BigDecimal expectedCash,
        @JsonProperty("actual_cash") BigDecimal actualCash,
        @JsonProperty("cash_variance") BigDecimal cashVariance,
        @JsonProperty("total_deposits") BigDecimal totalDeposits,
        @JsonProperty("closed_by") Long closedBy,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static EverydayClosing fromRow(Map<String,Object> row) {
        return new EverydayClosing(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"everyday_closing_id",Long.class),
            Rows.value(row,"dgt_id",String.class),
            Rows.value(row,"opening_datetime",OffsetDateTime.class),
            Rows.value(row,"closing_datetime",OffsetDateTime.class),
            Rows.value(row,"total_gross_sales",BigDecimal.class),
            Rows.value(row,"total_discounts",BigDecimal.class),
            Rows.value(row,"total_tax",BigDecimal.class),
            Rows.value(row,"total_net_sales",BigDecimal.class),
            Rows.value(row,"total_refunds",BigDecimal.class),
            Rows.value(row,"expected_cash",BigDecimal.class),
            Rows.value(row,"actual_cash",BigDecimal.class),
            Rows.value(row,"cash_variance",BigDecimal.class),
            Rows.value(row,"total_deposits",BigDecimal.class),
            Rows.value(row,"closed_by",Long.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
