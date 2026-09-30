package com.dgt.backend.employees.dto;

import jakarta.validation.constraints.Size;

public record UpdateEmployeeStatusHistoryRequest(
        Long employeeId,
        @Size(max = 50) String status,
        Long statusTypeId
) {}
