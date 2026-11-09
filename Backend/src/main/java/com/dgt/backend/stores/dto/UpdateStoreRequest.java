package com.dgt.backend.stores.dto;

import jakarta.validation.constraints.Size;

// Partial-update payload: service code treats null fields as unchanged, including boxed Boolean flags.
public record UpdateStoreRequest(
        @Size(max = 50) String storeId,
        @Size(max = 200) String storeName,
        @Size(max = 200) String legalBusinessName,
        @Size(max = 50) String taxId,
        @Size(max = 100) String licenseNumber,
        @Size(max = 50) String timezone,
        Long companyId
) {}
