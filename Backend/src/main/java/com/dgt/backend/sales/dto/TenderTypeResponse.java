package com.dgt.backend.sales.dto;

import com.dgt.backend.sales.entity.TenderType;
import java.time.OffsetDateTime;

public record TenderTypeResponse(
        Long tenderTypeId,
        String tenderCode,
        String tenderName,
        Boolean isActive,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static TenderTypeResponse from(TenderType e) {
        return new TenderTypeResponse(
                e.getTenderTypeId(), e.getTenderCode(), e.getTenderName(),
                e.getIsActive(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
