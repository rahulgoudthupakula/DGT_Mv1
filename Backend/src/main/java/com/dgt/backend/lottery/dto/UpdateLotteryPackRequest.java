package com.dgt.backend.lottery.dto;

import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;

public record UpdateLotteryPackRequest(
        Long invoiceId,
        @Size(max = 50) String dgtId,
        Long vendorId,
        Integer startTicketNumber,
        Integer endTicketNumber,
        Integer totalTickets,
        Long statusId,
        OffsetDateTime returnDate,
        Long performedBy
) {}
