package com.dgt.backend.fuel.dto;

import com.dgt.backend.fuel.entity.FuelInvoiceItem;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Response DTO for stored FuelInvoiceItem fields.
 */

public record FuelInvoiceItemResponse(
        Long fuelInvoiceItemId,
        Long invoiceId,
        Long fuelGradeId,
        BigDecimal grossGallons,
        BigDecimal netGallons,
        BigDecimal pricePerGallon,
        BigDecimal fuelLineTotal,
        OffsetDateTime createdAt
) {
    /** Copy entity fields to the response without changing the stored record. */
    public static FuelInvoiceItemResponse from(FuelInvoiceItem e) {
        return new FuelInvoiceItemResponse(
                e.getFuelInvoiceItemId(), e.getInvoiceId(), e.getFuelGradeId(),
                e.getGrossGallons(), e.getNetGallons(), e.getPricePerGallon(),
                e.getFuelLineTotal(), e.getCreatedAt());
    }
}
