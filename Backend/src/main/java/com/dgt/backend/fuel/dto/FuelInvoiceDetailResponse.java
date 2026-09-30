package com.dgt.backend.fuel.dto;

import com.dgt.backend.fuel.entity.FuelInvoiceDetail;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record FuelInvoiceDetailResponse(
        Long fuelInvoiceDetailsId,
        Long invoiceId,
        String deliveryNumber,
        String billOfLadingNumber,
        String carrierName,
        LocalDate deliveryDate,
        BigDecimal totalGallons,
        BigDecimal fuelSubtotal,
        BigDecimal freightAmount,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static FuelInvoiceDetailResponse from(FuelInvoiceDetail e) {
        return new FuelInvoiceDetailResponse(
                e.getFuelInvoiceDetailsId(), e.getInvoiceId(), e.getDeliveryNumber(),
                e.getBillOfLadingNumber(), e.getCarrierName(), e.getDeliveryDate(),
                e.getTotalGallons(), e.getFuelSubtotal(), e.getFreightAmount(),
                e.getCreatedAt(), e.getUpdatedAt());
    }
}
