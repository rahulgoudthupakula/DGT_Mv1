package com.dgt.backend.identity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Creation payload for StatusType.
 * Bean Validation annotations declare field requirements for the generic API.
 */

public record CreateStatusTypeRequest(
        @NotBlank @Size(max = 100) String statusName
) {}
