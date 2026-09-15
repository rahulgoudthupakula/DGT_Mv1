package com.dgt.backend.fuel.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.fuel_invoice_details; IDs and types follow the inspected database. */
public record FuelInvoiceDetail(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("fuel_invoice_details_id") Long fuelInvoiceDetailsId,
        @JsonProperty("invoice_id") Long invoiceId,
        @JsonProperty("delivery_number") String deliveryNumber,
        @JsonProperty("bill_of_lading_number") String billOfLadingNumber,
        @JsonProperty("carrier_name") String carrierName,
        @JsonProperty("delivery_date") LocalDate deliveryDate,
        @JsonProperty("total_gallons") BigDecimal totalGallons,
        @JsonProperty("fuel_subtotal") BigDecimal fuelSubtotal,
        @JsonProperty("freight_amount") BigDecimal freightAmount,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static FuelInvoiceDetail fromRow(Map<String,Object> row) {
        return new FuelInvoiceDetail(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"fuel_invoice_details_id",Long.class),
            Rows.value(row,"invoice_id",Long.class),
            Rows.value(row,"delivery_number",String.class),
            Rows.value(row,"bill_of_lading_number",String.class),
            Rows.value(row,"carrier_name",String.class),
            Rows.value(row,"delivery_date",LocalDate.class),
            Rows.value(row,"total_gallons",BigDecimal.class),
            Rows.value(row,"fuel_subtotal",BigDecimal.class),
            Rows.value(row,"freight_amount",BigDecimal.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
