package com.dgt.backend.stores.dto;

import jakarta.validation.constraints.Size;

public record UpdateStoreContactInfoRequest(
        @Size(max = 50) String dgtId,
        @Size(max = 20) String phoneNumber,
        @Size(max = 200) String email,
        String address,
        @Size(max = 200) String storeName
) {}
