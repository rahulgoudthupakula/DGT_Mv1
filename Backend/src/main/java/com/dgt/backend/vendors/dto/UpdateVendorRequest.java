package com.dgt.backend.vendors.dto;

import jakarta.validation.constraints.Size;

// Partial-update payload: service code treats null fields as unchanged, including boxed Boolean flags.
public record UpdateVendorRequest(
        @Size(max = 200) String vendorName,
        @Size(max = 200) String email,
        @Size(max = 20) String phoneNumber,
        String websiteUrl,
        @Size(max = 100) String paymentTerms,
        Integer leadTimeDays,
        Boolean isActive
) {}
