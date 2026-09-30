package com.dgt.backend.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CreateInventoryRequest(
        @NotBlank @Size(max = 50) String dgtId,
        @NotNull Long productId,
        BigDecimal availableQuantity,
        BigDecimal cost,
        BigDecimal returnCost
) {}
