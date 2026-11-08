package com.dgt.backend.products.dto;

import jakarta.validation.constraints.Size;

// Partial-update payload: service code treats null fields as unchanged, including boxed Boolean flags.
public record UpdateBrandRequest(
        @Size(max = 100) String brandName,
        String description
) {}
