package com.dgt.backend.identity.dto;

import com.dgt.backend.identity.entity.StatusType;

/**
 * Response DTO for stored StatusType fields.
 */

public record StatusTypeResponse(
        Long statusTypeId,
        String statusName
) {
    /** Copy entity fields to the response without changing the stored record. */
    public static StatusTypeResponse from(StatusType e) {
        return new StatusTypeResponse(e.getStatusTypeId(), e.getStatusName());
    }
}
