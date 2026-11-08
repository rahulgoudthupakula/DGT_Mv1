package com.dgt.backend.identity.dto;

import com.dgt.backend.identity.entity.User;
import java.time.OffsetDateTime;

/**
 * Response DTO for stored User fields.
 */

public record UserResponse(
        Long userId,
        String dgtId,
        String employeeId,
        String firstName,
        String lastName,
        String email,
        String accountStatus,
        Boolean twoFactorAuthentication,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    /** Copy entity fields to the response without changing the stored record. */
    public static UserResponse from(User e) {
        return new UserResponse(
                e.getUserId(), e.getDgtId(), e.getEmployeeId(),
                e.getFirstName(), e.getLastName(), e.getEmail(),
                e.getAccountStatus(), e.getTwoFactorAuthentication(),
                e.getCreatedAt(), e.getUpdatedAt());
    }
}
