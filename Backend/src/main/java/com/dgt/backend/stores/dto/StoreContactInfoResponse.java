package com.dgt.backend.stores.dto;

import com.dgt.backend.stores.entity.StoreContactInfo;
import java.time.OffsetDateTime;

public record StoreContactInfoResponse(
        Long contactInfoId,
        String dgtId,
        String phoneNumber,
        String email,
        String address,
        String storeName,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static StoreContactInfoResponse from(StoreContactInfo e) {
        return new StoreContactInfoResponse(
                e.getContactInfoId(), e.getDgtId(), e.getPhoneNumber(),
                e.getEmail(), e.getAddress(), e.getStoreName(),
                e.getCreatedAt(), e.getUpdatedAt());
    }
}
