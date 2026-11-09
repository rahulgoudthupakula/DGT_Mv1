package com.dgt.backend.fuel.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Partial update payload for FuelInvoiceDetail.
 * The service ignores null fields, so omitted values are preserved rather than cleared.
 */

public record UpdateFuelInvoiceDetailRequest(
        Long invoiceId,
        @Size(max = 100) String deliveryNumber,
        @Size(max = 100) String billOfLadingNumber,
        @Size(max = 100) String carrierName,
        LocalDate deliveryDate,
        BigDecimal totalGallons,
        BigDecimal fuelSubtotal,
        BigDecimal freightAmount
) {}
