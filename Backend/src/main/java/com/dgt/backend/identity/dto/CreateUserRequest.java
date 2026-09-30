package com.dgt.backend.identity.dto;

import jakarta.validation.constraints.Size;

public record CreateUserRequest(
        @Size(max = 50) String dgtId,
        @Size(max = 50) String employeeId,
        @Size(max = 100) String firstName,
        @Size(max = 100) String lastName,
        @Size(max = 200) String email,
        @Size(max = 50) String accountStatus,
        Boolean twoFactorAuthentication
) {}
