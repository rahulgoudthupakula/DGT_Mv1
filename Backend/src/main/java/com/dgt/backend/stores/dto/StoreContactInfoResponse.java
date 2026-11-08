package com.dgt.backend.stores.dto;

import com.dgt.backend.stores.entity.StoreContactInfo;
import java.time.OffsetDateTime;

// Response projection for the store contact information record, including database identity and lifecycle timestamps.
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
    // Copy entity fields into the response without exposing the persistence object itself.
    public static StoreContactInfoResponse from(StoreContactInfo e) {
        return new StoreContactInfoResponse(
                e.getContactInfoId(), e.getDgtId(), e.getPhoneNumber(),
                e.getEmail(), e.getAddress(), e.getStoreName(),
                e.getCreatedAt(), e.getUpdatedAt());
    }
}
