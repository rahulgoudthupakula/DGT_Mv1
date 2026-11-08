package com.dgt.backend.vendors.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// Creation payload for the generic vendor API; declared constraints run when validated by the controller.
public record CreateVendorRequest(
        @NotBlank @Size(max = 200) String vendorName,
        @Size(max = 200) String email,
        @Size(max = 20) String phoneNumber,
        String websiteUrl,
        @Size(max = 100) String paymentTerms,
        Integer leadTimeDays,
        Boolean isActive
) {}
