package com.dgt.backend.vendors.dto;

import com.dgt.backend.vendors.entity.Vendor;
import java.time.OffsetDateTime;

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
    public static VendorResponse from(Vendor e) {
        return new VendorResponse(
                e.getVendorId(), e.getVendorName(), e.getEmail(),
                e.getPhoneNumber(), e.getWebsiteUrl(), e.getPaymentTerms(),
                e.getLeadTimeDays(), e.getIsActive(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
