package com.dgt.backend.pos.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

/** DGT v1 contract. These fields are not a Verifone wire format. */
// Keep monetary values decimal and the sale timestamp offset-aware; transaction type expresses direction.
public record PosTransaction(int version, String dgtId, String sourceSystem, String sourceTransactionId,
 String registerCode, String cashierCode, String receiptNo, String transactionType, String saleStatus,
 OffsetDateTime saleDateTime, String originalTransactionId, BigDecimal subtotal, BigDecimal taxableAmount,
 BigDecimal taxAmount, BigDecimal discountAmount, BigDecimal totalAmount, Integer totalItems,
 List<Item> items, List<Payment> payments) {
 // Keep product codes/barcodes as strings so leading zeros survive; quantities may be fractional.
 public record Item(String productCode, String barcode, BigDecimal quantity, BigDecimal catalogPrice,
  BigDecimal unitPrice, BigDecimal grossAmount, BigDecimal discountAmount, BigDecimal taxableAmount,
  BigDecimal taxAmount, BigDecimal lineTotal) {}
 // Carry tender totals and an optional card brand only, never card numbers or sensitive card data.
 public record Payment(String tenderCode, BigDecimal paymentAmount, String paymentStatus, String cardBrand) {}
}
