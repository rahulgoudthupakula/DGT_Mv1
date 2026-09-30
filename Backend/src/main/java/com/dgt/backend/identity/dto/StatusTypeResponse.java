package com.dgt.backend.identity.dto;

import com.dgt.backend.identity.entity.StatusType;

public record StatusTypeResponse(
        Long statusTypeId,
        String statusName
) {
    public static StatusTypeResponse from(StatusType e) {
        return new StatusTypeResponse(e.getStatusTypeId(), e.getStatusName());
    }
}
