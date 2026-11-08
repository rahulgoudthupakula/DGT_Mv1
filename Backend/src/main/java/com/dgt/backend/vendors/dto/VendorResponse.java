package com.dgt.backend.vendors.dto;

import com.dgt.backend.vendors.entity.Vendor;
import java.time.OffsetDateTime;

// Response projection for the vendor record, including database identity and lifecycle timestamps.
public record VendorResponse(
        Long vendorId,
        String vendorName,
        String email,
        String phoneNumber,
        String websiteUrl,
        String paymentTerms,
        Integer leadTimeDays,
        Boolean isActive,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    // Copy entity fields into the response without exposing the persistence object itself.
    public static VendorResponse from(Vendor e) {
        return new VendorResponse(
                e.getVendorId(), e.getVendorName(), e.getEmail(),
                e.getPhoneNumber(), e.getWebsiteUrl(), e.getPaymentTerms(),
                e.getLeadTimeDays(), e.getIsActive(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
