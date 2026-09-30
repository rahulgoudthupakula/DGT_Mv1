package com.dgt.backend.employees.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateEmployeeStatusHistoryRequest(
        @NotNull Long employeeId,
        @NotBlank @Size(max = 50) String status,
        Long statusTypeId
) {}
