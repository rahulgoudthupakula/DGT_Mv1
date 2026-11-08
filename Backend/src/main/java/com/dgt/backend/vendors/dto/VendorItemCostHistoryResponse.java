package com.dgt.backend.vendors.dto;

import com.dgt.backend.vendors.entity.VendorItemCostHistory;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

// Response projection for the vendor cost history record, including database identity and lifecycle timestamps.
public record VendorItemCostHistoryResponse(
        Long costHistoryId,
        Long productId,
        Long vendorId,
        BigDecimal oldCost,
        BigDecimal newCost,
        BigDecimal changePercentage,
        LocalDate effectiveDate,
        String changeSource,
        Long changedBy,
        OffsetDateTime createdDate,
        OffsetDateTime updatedDate
) {
    // Copy entity fields into the response without exposing the persistence object itself.
    public static VendorItemCostHistoryResponse from(VendorItemCostHistory e) {
        return new VendorItemCostHistoryResponse(
                e.getCostHistoryId(), e.getProductId(), e.getVendorId(),
                e.getOldCost(), e.getNewCost(), e.getChangePercentage(),
                e.getEffectiveDate(), e.getChangeSource(), e.getChangedBy(),
                e.getCreatedDate(), e.getUpdatedDate());
    }
}
