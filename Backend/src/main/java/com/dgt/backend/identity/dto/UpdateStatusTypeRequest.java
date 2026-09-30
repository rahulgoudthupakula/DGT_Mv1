package com.dgt.backend.identity.dto;

import jakarta.validation.constraints.Size;

public record UpdateStatusTypeRequest(
        @Size(max = 100) String statusName
) {}
