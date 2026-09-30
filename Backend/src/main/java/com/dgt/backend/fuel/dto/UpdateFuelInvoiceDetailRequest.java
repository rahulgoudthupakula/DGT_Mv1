package com.dgt.backend.fuel.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

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
