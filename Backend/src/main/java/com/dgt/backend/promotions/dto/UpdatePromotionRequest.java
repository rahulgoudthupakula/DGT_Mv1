package com.dgt.backend.promotions.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

// Partial-update payload: service code treats null fields as unchanged, including boxed Boolean flags.
public record UpdatePromotionRequest(
        @Size(max = 50) String dgtId,
        @Size(max = 200) String promotionName,
        @Size(max = 50) String promotionType,
        OffsetDateTime startDate,
        OffsetDateTime endDate,
        @Size(max = 50) String status,
        BigDecimal discountValue
) {}
