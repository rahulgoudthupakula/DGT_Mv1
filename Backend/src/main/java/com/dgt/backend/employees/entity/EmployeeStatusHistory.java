package com.dgt.backend.employees.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * JPA mapping of employee_status_history.
 * Stores record fields and scalar relationship identifiers; workflow rules live outside this entity.
 */

@Entity
@Table(name = "employee_status_history")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EmployeeStatusHistory {

    // Database-generated primary key.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "status_history_id")
    private Long statusHistoryId;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "status", nullable = false, length = 50)
    private String status;

    @Column(name = "status_type_id")
    private Long statusTypeId;
}
