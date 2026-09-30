package com.dgt.backend.identity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateStatusTypeRequest(
        @NotBlank @Size(max = 100) String statusName
) {}
