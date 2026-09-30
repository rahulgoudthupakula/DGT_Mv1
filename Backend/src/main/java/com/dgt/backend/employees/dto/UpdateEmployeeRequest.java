package com.dgt.backend.employees.dto;

import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record UpdateEmployeeRequest(
        LocalDate hireDate,
        LocalDate terminationDate,
        @Size(max = 50) String employeeType,
        Long userId
) {}
