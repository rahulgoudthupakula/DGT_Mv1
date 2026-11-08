package com.dgt.backend.lottery.dto;

import com.dgt.backend.lottery.entity.LotteryPack;
import java.time.OffsetDateTime;

/**
 * Response DTO for stored LotteryPack fields.
 */

public record LotteryPackResponse(
        Long lotteryPackId,
        Long invoiceId,
        String dgtId,
        Long vendorId,
        Integer startTicketNumber,
        Integer endTicketNumber,
        Integer totalTickets,
        Long statusId,
        OffsetDateTime returnDate,
        Long performedBy,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    /** Copy entity fields to the response without changing the stored record. */
    public static LotteryPackResponse from(LotteryPack e) {
        return new LotteryPackResponse(
                e.getLotteryPackId(), e.getInvoiceId(), e.getDgtId(),
                e.getVendorId(), e.getStartTicketNumber(), e.getEndTicketNumber(),
                e.getTotalTickets(), e.getStatusId(), e.getReturnDate(),
                e.getPerformedBy(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
