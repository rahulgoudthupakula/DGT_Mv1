package com.dgt.backend.vendors.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

// Partial-update payload: service code treats null fields as unchanged, including boxed Boolean flags.
public record UpdateVendorItemCostHistoryRequest(
        Long productId,
        Long vendorId,
        BigDecimal oldCost,
        BigDecimal newCost,
        BigDecimal changePercentage,
        LocalDate effectiveDate,
        @Size(max = 50) String changeSource,
        Long changedBy
) {}
