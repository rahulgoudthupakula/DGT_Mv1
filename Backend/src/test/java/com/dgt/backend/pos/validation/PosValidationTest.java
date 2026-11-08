package com.dgt.backend.pos.validation;
import com.dgt.backend.pos.dto.PosTransaction;
import com.dgt.backend.pos.security.PosSecurity;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
class PosValidationTest {
 static BigDecimal n(String s){return new BigDecimal(s);}
 static PosTransaction fixture(String type){return new PosTransaction(1,"TEST","VERIFONE_COMMANDER_SIMULATOR","one","R","C","receipt",type,type.equals("VOID")?"VOIDED":type.equals("REFUND")?"REFUNDED":"COMPLETED",OffsetDateTime.parse("2026-01-01T12:00:00-05:00"),null,n("2.49"),n("2.49"),n("0.15"),n("0.00"),n("2.64"),1,List.of(new PosTransaction.Item("COLA","00001",n("1"),n("2.49"),n("2.49"),n("2.49"),n("0.00"),n("2.49"),n("0.15"),n("2.64"))),type.equals("VOID")?List.of():List.of(new PosTransaction.Payment("CASH",n("2.64"),type.equals("SALE")?"COMPLETED":"REFUNDED",null)));}
 @Test void simulatorCannotRunInProduction(){assertFalse(PosSecurity.simulatorAllowed(true,"production"));assertFalse(PosSecurity.simulatorAllowed(false,"testing"));assertTrue(PosSecurity.simulatorAllowed(true,"testing"));}
 @Test void types(){for(String type:List.of("SALE","RETURN","VOID","REFUND"))assertDoesNotThrow(()->PosValidation.validate(fixture(type)));}
 @Test void moneyValidation(){assertThrows(ResponseStatusException.class,()->PosValidation.money(n("-1")));assertThrows(ResponseStatusException.class,()->PosValidation.money(n("0.001")));}
 @Test void missingData(){assertThrows(ResponseStatusException.class,()->PosValidation.validate(null));}
 @Test void mismatch(){var t=fixture("SALE");var bad=new PosTransaction(t.version(),t.dgtId(),t.sourceSystem(),t.sourceTransactionId(),t.registerCode(),t.cashierCode(),t.receiptNo(),t.transactionType(),t.saleStatus(),t.saleDateTime(),null,t.subtotal(),t.taxableAmount(),t.taxAmount(),t.discountAmount(),n("9.99"),t.totalItems(),t.items(),t.payments());assertThrows(ResponseStatusException.class,()->PosValidation.validate(bad));}
}
