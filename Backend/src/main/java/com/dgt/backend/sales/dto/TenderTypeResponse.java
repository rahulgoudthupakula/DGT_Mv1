package com.dgt.backend.sales.dto;

import com.dgt.backend.sales.entity.TenderType;
import java.time.OffsetDateTime;

// Response projection for the tender type record, including database identity and lifecycle timestamps.
public record TenderTypeResponse(
        Long tenderTypeId,
        String tenderCode,
        String tenderName,
        Boolean isActive,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    // Copy entity fields into the response without exposing the persistence object itself.
    public static TenderTypeResponse from(TenderType e) {
        return new TenderTypeResponse(
                e.getTenderTypeId(), e.getTenderCode(), e.getTenderName(),
                e.getIsActive(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
