package com.dgt.backend.reports.entity;

import java.math.BigDecimal;
import com.fasterxml.jackson.annotation.JsonProperty;

public record InventorySnapshot(@JsonProperty("inventory_id") Long inventoryId,@JsonProperty("dgt_id") String dgtId,
    @JsonProperty("product_id") Long productId,@JsonProperty("product_name") String productName,
    @JsonProperty("available_quantity") BigDecimal availableQuantity,BigDecimal cost,@JsonProperty("return_cost") BigDecimal returnCost) {}
