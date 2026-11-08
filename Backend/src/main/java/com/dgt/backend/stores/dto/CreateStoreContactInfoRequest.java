package com.dgt.backend.stores.dto;

import jakarta.validation.constraints.Size;

// Creation payload for the generic store contact information API; declared constraints run when validated by the controller.
public record CreateStoreContactInfoRequest(
        @Size(max = 50) String dgtId,
        @Size(max = 20) String phoneNumber,
        @Size(max = 200) String email,
        String address,
        @Size(max = 200) String storeName
) {}
