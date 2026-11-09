package com.dgt.backend.pos.validation;
import com.dgt.backend.pos.dto.PosTransaction;
import java.math.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
// Validate the normalized simulator contract before ingestion performs store and mapping checks.
public final class PosValidation {
 private PosValidation(){}
 // Use HTTP 422 for a syntactically readable transaction that violates the contract.
 public static void bad(String message){throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,message);}
 // Bound required source identifiers before they reach persistence.
 public static void text(String value,int max){if(value==null||value.isBlank()||value.length()>max)bad("Missing or oversized transaction identifier");}
 // Require positive magnitudes or zero even for returns/refunds; limit currency scale and size.
 static BigDecimal money(BigDecimal value){if(value==null||value.signum()<0||value.scale()>2||value.precision()-value.scale()>12)bad("Amounts must be nonnegative decimal currency with at most two decimal places");return value;}
 // Compare decimal values numerically so scale differences alone do not cause a mismatch.
 static void equal(BigDecimal a,BigDecimal b){if(a.compareTo(b)!=0)bad("Transaction totals do not reconcile");}
 // Enforce supported source/version, status conventions, receipt totals and payment consistency.
 public static void validate(PosTransaction t){
  if(t==null||t.version()!=1||!"VERIFONE_COMMANDER_SIMULATOR".equals(t.sourceSystem()))bad("Unsupported contract or source");
  text(t.dgtId(),50);text(t.sourceTransactionId(),100);text(t.registerCode(),100);text(t.cashierCode(),100);text(t.receiptNo(),100);
  if(t.saleDateTime()==null)bad("Timestamp with offset required");
  if(t.originalTransactionId()!=null)text(t.originalTransactionId(),100);
  if(t.transactionType()==null||!Set.of("SALE","RETURN","REFUND","VOID").contains(t.transactionType()))bad("Unsupported transaction type");
  String expected=switch(t.transactionType()){case "VOID"->"VOIDED";case "REFUND"->"REFUNDED";default->"COMPLETED";};
  if(!expected.equals(t.saleStatus()))bad("Status does not match transaction type");
  if(t.items()==null||t.items().isEmpty()||t.items().size()>500||t.payments()==null||t.payments().size()>20)bad("Invalid item or payment count");
  BigDecimal gross=BigDecimal.ZERO,discount=BigDecimal.ZERO,tax=BigDecimal.ZERO,taxable=BigDecimal.ZERO,total=BigDecimal.ZERO;
  // Reconcile each line with half-up currency rounding before accumulating receipt totals.
  for(var i:t.items()){
   if(i==null)bad("Missing item");
   if((i.productCode()==null||i.productCode().isBlank())&&(i.barcode()==null||i.barcode().isBlank()))bad("Item code or barcode required");
   if(i.productCode()!=null)text(i.productCode(),100);if(i.barcode()!=null)text(i.barcode(),50);
   if(i.quantity()==null||i.quantity().signum()<=0||i.quantity().scale()>3||i.quantity().precision()-i.quantity().scale()>9)bad("Invalid quantity");
   money(i.catalogPrice());money(i.unitPrice());money(i.grossAmount());money(i.discountAmount());money(i.taxableAmount());money(i.taxAmount());money(i.lineTotal());
   equal(i.unitPrice().multiply(i.quantity()).setScale(2,RoundingMode.HALF_UP),i.grossAmount());
   if(i.discountAmount().compareTo(i.grossAmount())>0||i.taxableAmount().compareTo(i.grossAmount().subtract(i.discountAmount()))>0)bad("Invalid discount or taxable amount");
   equal(i.grossAmount().subtract(i.discountAmount()).add(i.taxAmount()),i.lineTotal());
   gross=gross.add(i.grossAmount());discount=discount.add(i.discountAmount());tax=tax.add(i.taxAmount());taxable=taxable.add(i.taxableAmount());total=total.add(i.lineTotal());
  }
  // Header amounts must exactly match the sums of the normalized receipt lines.
  equal(money(t.subtotal()),gross);equal(money(t.discountAmount()),discount);equal(money(t.taxAmount()),tax);equal(money(t.taxableAmount()),taxable);equal(money(t.totalAmount()),total);
  // totalItems is the number of receipt lines, not a rounded sum of fractional quantities.
  if(t.totalItems()==null||t.totalItems()!=t.items().size())bad("totalItems must equal receipt line count");
  BigDecimal paid=BigDecimal.ZERO;
  // Require direction-appropriate payment statuses and an allowlisted card brand.
  for(var p:t.payments()){
   if(p==null)bad("Missing payment");text(p.tenderCode(),100);money(p.paymentAmount());
   String status=t.transactionType().equals("VOID")?"VOIDED":t.transactionType().equals("REFUND")||t.transactionType().equals("RETURN")?"REFUNDED":"COMPLETED";
   if(!status.equals(p.paymentStatus()))bad("Payment status does not match transaction type");
   if(p.cardBrand()!=null&&!Set.of("VISA","MASTERCARD","AMEX","DISCOVER","OTHER").contains(p.cardBrand()))bad("Unsupported card brand");
   paid=paid.add(p.paymentAmount());
  }
  // Void fixtures contain no payments; all other transaction types must be fully covered by payments.
  if(t.transactionType().equals("VOID")){if(!t.payments().isEmpty())bad("Void fixtures must not contain payments");}
  else {if(t.payments().isEmpty())bad("Payment required");equal(paid,total);}
 }
}
