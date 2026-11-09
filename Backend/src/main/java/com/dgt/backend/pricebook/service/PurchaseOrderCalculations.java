package com.dgt.backend.pricebook.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Recommendations use base units; employee overrides are validated separately when saved. */
public final class PurchaseOrderCalculations {
    private PurchaseOrderCalculations() {}

    public static BigDecimal suggested(BigDecimal stock, BigDecimal target, BigDecimal minimum, BigDecimal pack) {
        // Legacy invalid pack sizes must not produce division-by-zero recommendations.
        BigDecimal effectivePack = pack.signum() > 0 ? pack : BigDecimal.ONE;
        BigDecimal needed = target.subtract(stock).max(BigDecimal.ZERO);
        if (needed.signum() == 0) return BigDecimal.ZERO;
        return needed.max(minimum).divide(effectivePack, 0, RoundingMode.CEILING).multiply(effectivePack);
    }
}
