package com.dgt.backend.fuel.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.fuel_invoice_items; IDs and types follow the inspected database. */
public record FuelInvoiceItem(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("fuel_invoice_item_id") Long fuelInvoiceItemId,
        @JsonProperty("invoice_id") Long invoiceId,
        @JsonProperty("fuel_grade_id") Long fuelGradeId,
        @JsonProperty("gross_gallons") BigDecimal grossGallons,
        @JsonProperty("net_gallons") BigDecimal netGallons,
        @JsonProperty("price_per_gallon") BigDecimal pricePerGallon,
        @JsonProperty("fuel_line_total") BigDecimal fuelLineTotal,
        @JsonProperty("created_at") OffsetDateTime createdAt) {
    public static FuelInvoiceItem fromRow(Map<String,Object> row) {
        return new FuelInvoiceItem(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"fuel_invoice_item_id",Long.class),
            Rows.value(row,"invoice_id",Long.class),
            Rows.value(row,"fuel_grade_id",Long.class),
            Rows.value(row,"gross_gallons",BigDecimal.class),
            Rows.value(row,"net_gallons",BigDecimal.class),
            Rows.value(row,"price_per_gallon",BigDecimal.class),
            Rows.value(row,"fuel_line_total",BigDecimal.class),
            Rows.value(row,"created_at",OffsetDateTime.class));
    }
}
