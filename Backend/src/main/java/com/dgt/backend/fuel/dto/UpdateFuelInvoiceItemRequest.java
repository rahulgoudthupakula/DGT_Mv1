package com.dgt.backend.fuel.dto;

import java.math.BigDecimal;

public record UpdateFuelInvoiceItemRequest(
        Long invoiceId,
        Long fuelGradeId,
        BigDecimal grossGallons,
        BigDecimal netGallons,
        BigDecimal pricePerGallon,
        BigDecimal fuelLineTotal
) {}
