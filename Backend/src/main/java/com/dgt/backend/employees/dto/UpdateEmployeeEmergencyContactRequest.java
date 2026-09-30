package com.dgt.backend.employees.dto;

import jakarta.validation.constraints.Size;

public record UpdateEmployeeEmergencyContactRequest(
        Long employeeId,
        @Size(max = 100) String contactName,
        @Size(max = 50) String relationship,
        @Size(max = 20) String phone
) {}
