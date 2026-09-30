package com.dgt.backend.stores.dto;

import com.dgt.backend.stores.entity.Store;
import java.time.OffsetDateTime;

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
    public static StoreResponse from(Store e) {
        return new StoreResponse(
                e.getDgtId(), e.getStoreId(), e.getStoreName(),
                e.getLegalBusinessName(), e.getTaxId(), e.getLicenseNumber(),
                e.getTimezone(), e.getCompanyId(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
