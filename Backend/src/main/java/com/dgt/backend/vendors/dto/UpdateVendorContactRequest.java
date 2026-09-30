package com.dgt.backend.vendors.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateVendorContactRequest(
        Long vendorId,
        @Size(max = 50) String dgtId,
        @Size(max = 100) String contractNumber,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal volumeThreshold,
        BigDecimal volumeDiscountValue,
        @Size(max = 50) String volumeDiscountType,
        Integer returnWindowDays,
        @Size(max = 50) String status,
        String documentUrl,
        LocalDate forceEndDate
) {}
