package com.dgt.backend.reports.entity;

import java.time.LocalDate;
import java.math.BigDecimal;
import com.fasterxml.jackson.annotation.JsonProperty;

public record SalesSummary(@JsonProperty("sale_date") LocalDate saleDate,long transactions,
    BigDecimal subtotal,@JsonProperty("tax_amount") BigDecimal taxAmount,@JsonProperty("total_amount") BigDecimal totalAmount) {}
