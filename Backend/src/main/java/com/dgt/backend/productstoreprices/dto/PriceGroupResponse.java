package com.dgt.backend.productstoreprices.dto;

import com.dgt.backend.productstoreprices.entity.PriceGroup;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record PriceGroupResponse(
        Long priceGroupId,
        String priceGroupName,
        String description,
        Boolean isActive,
        BigDecimal groupPrice,
        String dgtId,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static PriceGroupResponse from(PriceGroup e) {
        return new PriceGroupResponse(
                e.getPriceGroupId(), e.getPriceGroupName(), e.getDescription(),
                e.getIsActive(), e.getGroupPrice(), e.getDgtId(),
                e.getCreatedAt(), e.getUpdatedAt());
    }
}
