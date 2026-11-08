package com.dgt.backend.identity.dto;

import jakarta.validation.constraints.Size;

/**
 * Partial update payload for StatusType.
 * The service ignores null fields, so omitted values are preserved rather than cleared.
 */

public record UpdateStatusTypeRequest(
        @Size(max = 100) String statusName
) {}
