package com.dgt.backend.products.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// Creation payload for the generic brand API; declared constraints run when validated by the controller.
public record CreateBrandRequest(
        @NotBlank @Size(max = 100) String brandName,
        String description
) {}
