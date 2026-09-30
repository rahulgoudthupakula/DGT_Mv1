package com.dgt.backend.products.dto;

import jakarta.validation.constraints.Size;

public record UpdateBrandRequest(
        @Size(max = 100) String brandName,
        String description
) {}
