package com.dgt.backend.products.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateBrandRequest(
        @NotBlank @Size(max = 100) String brandName,
        String description
) {}
