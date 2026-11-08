package com.dgt.backend.pricebook.service;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.assertEquals;

class PurchaseOrderCalculationsTest {
    private void expect(String stock, String target, String minimum, String pack, String expected) {
        assertEquals(0, new BigDecimal(expected).compareTo(PurchaseOrderCalculations.suggested(
            new BigDecimal(stock), new BigDecimal(target), new BigDecimal(minimum), new BigDecimal(pack))));
    }
    @Test void roundsShortageUpToWholePacks() { expect("7", "20", "1", "6", "18"); }
    @Test void respectsMinimumOrder() { expect("19", "20", "13", "6", "18"); }
    @Test void doesNotOrderWhenStockMeetsTarget() { expect("20", "20", "12", "6", "0"); expect("21", "20", "12", "6", "0"); }
    @Test void handlesFractionalAndNegativeStock() { expect("1.25", "3", "1", "0.5", "2"); expect("-2", "10", "1", "6", "12"); }
    @Test void toleratesLegacyZeroPack() { expect("7", "20", "1", "0", "13"); }
}
