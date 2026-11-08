package com.dgt.backend.fuel.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/**
 * Creation payload for FuelInvoiceItem.
 * Bean Validation annotations declare field requirements for the generic API.
 */

public record CreateFuelInvoiceItemRequest(
        @NotNull Long invoiceId,
        @NotNull Long fuelGradeId,
        @NotNull BigDecimal grossGallons,
        @NotNull BigDecimal netGallons,
        @NotNull BigDecimal pricePerGallon,
        @NotNull BigDecimal fuelLineTotal
) {}
