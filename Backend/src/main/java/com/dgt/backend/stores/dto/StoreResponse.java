package com.dgt.backend.stores.dto;

import com.dgt.backend.stores.entity.Store;
import java.time.OffsetDateTime;

// Response projection for the store record, including database identity and lifecycle timestamps.
public record StoreResponse(
        String dgtId,
        String storeId,
        String storeName,
        String legalBusinessName,
        String taxId,
        String licenseNumber,
        String timezone,
        Long companyId,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    // Copy entity fields into the response without exposing the persistence object itself.
    public static StoreResponse from(Store e) {
        return new StoreResponse(
                e.getDgtId(), e.getStoreId(), e.getStoreName(),
                e.getLegalBusinessName(), e.getTaxId(), e.getLicenseNumber(),
                e.getTimezone(), e.getCompanyId(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
