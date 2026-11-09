package com.dgt.backend.employees.dto;

import com.dgt.backend.employees.entity.EmployeeEmergencyContact;
import java.time.OffsetDateTime;

/**
 * Response DTO for stored EmployeeEmergencyContact fields.
 */

public record EmployeeEmergencyContactResponse(
        Long emergencyContactId,
        Long employeeId,
        String contactName,
        String relationship,
        String phone,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    /** Copy entity fields to the response without changing the stored record. */
    public static EmployeeEmergencyContactResponse from(EmployeeEmergencyContact e) {
        return new EmployeeEmergencyContactResponse(
                e.getEmergencyContactId(), e.getEmployeeId(), e.getContactName(),
                e.getRelationship(), e.getPhone(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
