package com.dgt.backend.invoices.dto;

import com.dgt.backend.invoices.entity.GroceryInvoiceItem;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record GroceryInvoiceItemResponse(
        Long groceryInvoiceItemId,
        Long invoiceId,
        Long productId,
        String vendorItemCode,
        BigDecimal quantity,
        String unitType,
        BigDecimal casePackQuantity,
        BigDecimal msrp,
        BigDecimal unitCost,
        BigDecimal itemLineDiscount,
        BigDecimal itemLineTotal,
        Boolean isProductNew,
        OffsetDateTime archivedAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static GroceryInvoiceItemResponse from(GroceryInvoiceItem e) {
        return new GroceryInvoiceItemResponse(
                e.getGroceryInvoiceItemId(), e.getInvoiceId(), e.getProductId(),
                e.getVendorItemCode(), e.getQuantity(), e.getUnitType(),
                e.getCasePackQuantity(), e.getMsrp(), e.getUnitCost(),
                e.getItemLineDiscount(), e.getItemLineTotal(), e.getIsProductNew(),
                e.getArchivedAt(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
