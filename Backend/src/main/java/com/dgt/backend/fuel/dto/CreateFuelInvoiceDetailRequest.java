package com.dgt.backend.fuel.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Creation payload for FuelInvoiceDetail.
 * Bean Validation annotations declare field requirements for the generic API.
 */

public record CreateFuelInvoiceDetailRequest(
        @NotNull Long invoiceId,
        @Size(max = 100) String deliveryNumber,
        @Size(max = 100) String billOfLadingNumber,
        @Size(max = 100) String carrierName,
        LocalDate deliveryDate,
        BigDecimal totalGallons,
        BigDecimal fuelSubtotal,
        BigDecimal freightAmount
) {}
