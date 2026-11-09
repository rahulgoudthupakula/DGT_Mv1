package com.dgt.backend.stores.dto;

import jakarta.validation.constraints.Size;

// Partial-update payload: service code treats null fields as unchanged, including boxed Boolean flags.
public record UpdateStoreContactInfoRequest(
        @Size(max = 50) String dgtId,
        @Size(max = 20) String phoneNumber,
        @Size(max = 200) String email,
        String address,
        @Size(max = 200) String storeName
) {}
