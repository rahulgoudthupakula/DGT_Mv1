package com.dgt.backend.products.dto;

import com.dgt.backend.products.entity.NewArrival;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record NewArrivalResponse(
        Long newArrivalsId,
        Long invoiceItemId,
        String productName,
        Long departmentId,
        Long storeSubDepartmentId,
        BigDecimal suggestedRetailPrice,
        Long statusId,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static NewArrivalResponse from(NewArrival e) {
        return new NewArrivalResponse(
                e.getNewArrivalsId(), e.getInvoiceItemId(), e.getProductName(),
                e.getDepartmentId(), e.getStoreSubDepartmentId(),
                e.getSuggestedRetailPrice(), e.getStatusId(),
                e.getCreatedAt(), e.getUpdatedAt());
    }
}
