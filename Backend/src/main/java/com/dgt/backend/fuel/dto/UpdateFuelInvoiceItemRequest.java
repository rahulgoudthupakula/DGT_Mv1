package com.dgt.backend.fuel.dto;

import java.math.BigDecimal;

/**
 * Partial update payload for FuelInvoiceItem.
 * The service ignores null fields, so omitted values are preserved rather than cleared.
 */

public record UpdateFuelInvoiceItemRequest(
        Long invoiceId,
        Long fuelGradeId,
        BigDecimal grossGallons,
        BigDecimal netGallons,
        BigDecimal pricePerGallon,
        BigDecimal fuelLineTotal
) {}
