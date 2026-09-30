package com.dgt.backend.stores.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateStoreRequest(
        @NotBlank @Size(max = 50) String dgtId,
        @Size(max = 50) String storeId,
        @NotBlank @Size(max = 200) String storeName,
        @Size(max = 200) String legalBusinessName,
        @Size(max = 50) String taxId,
        @Size(max = 100) String licenseNumber,
        @Size(max = 50) String timezone,
        Long companyId
) {}
