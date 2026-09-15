package com.dgt.backend.lottery.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.lottery_packs; IDs and types follow the inspected database. */
public record LotteryPack(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("lottery_pack_id") Long lotteryPackId,
        @JsonProperty("invoice_id") Long invoiceId,
        @JsonProperty("dgt_id") String dgtId,
        @JsonProperty("vendor_id") Long vendorId,
        @JsonProperty("start_ticket_number") Integer startTicketNumber,
        @JsonProperty("end_ticket_number") Integer endTicketNumber,
        @JsonProperty("total_tickets") Integer totalTickets,
        @JsonProperty("status_id") Long statusId,
        @JsonProperty("return_date") OffsetDateTime returnDate,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt,
        @JsonProperty("performed_by") Long performedBy) {
    public static LotteryPack fromRow(Map<String,Object> row) {
        return new LotteryPack(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"lottery_pack_id",Long.class),
            Rows.value(row,"invoice_id",Long.class),
            Rows.value(row,"dgt_id",String.class),
            Rows.value(row,"vendor_id",Long.class),
            Rows.value(row,"start_ticket_number",Integer.class),
            Rows.value(row,"end_ticket_number",Integer.class),
            Rows.value(row,"total_tickets",Integer.class),
            Rows.value(row,"status_id",Long.class),
            Rows.value(row,"return_date",OffsetDateTime.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class),
            Rows.value(row,"performed_by",Long.class));
    }
}
