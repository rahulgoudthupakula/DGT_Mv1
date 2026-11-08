package com.dgt.backend.vendors.dto;

import com.dgt.backend.vendors.entity.VendorContact;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

// Response projection for the vendor contract/contact record record, including database identity and lifecycle timestamps.
public record VendorContactResponse(
        Long contactId,
        Long vendorId,
        String dgtId,
        String contractNumber,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal volumeThreshold,
        BigDecimal volumeDiscountValue,
        String volumeDiscountType,
        Integer returnWindowDays,
        String status,
        String documentUrl,
        LocalDate forceEndDate,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    // Copy entity fields into the response without exposing the persistence object itself.
    public static VendorContactResponse from(VendorContact e) {
        return new VendorContactResponse(
                e.getContactId(), e.getVendorId(), e.getDgtId(),
                e.getContractNumber(), e.getStartDate(), e.getEndDate(),
                e.getVolumeThreshold(), e.getVolumeDiscountValue(), e.getVolumeDiscountType(),
                e.getReturnWindowDays(), e.getStatus(), e.getDocumentUrl(),
                e.getForceEndDate(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
