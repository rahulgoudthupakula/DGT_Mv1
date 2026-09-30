package com.dgt.backend.employees.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateEmployeeEmergencyContactRequest(
        @NotNull Long employeeId,
        @NotBlank @Size(max = 100) String contactName,
        @Size(max = 50) String relationship,
        @NotBlank @Size(max = 20) String phone
) {}
