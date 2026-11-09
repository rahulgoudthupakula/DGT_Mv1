package com.dgt.backend.vendors.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

// Creation payload for the generic vendor cost history API; declared constraints run when validated by the controller.
public record CreateVendorItemCostHistoryRequest(
        Long productId,
        Long vendorId,
        BigDecimal oldCost,
        BigDecimal newCost,
        BigDecimal changePercentage,
        LocalDate effectiveDate,
        @Size(max = 50) String changeSource,
        Long changedBy
) {}
