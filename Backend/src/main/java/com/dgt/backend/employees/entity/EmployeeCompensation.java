package com.dgt.backend.employees.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.SQLRestriction;
import java.math.BigDecimal;
import java.time.*;

/**
 * JPA mapping of employee_compensation.
 * Stores record fields and scalar relationship identifiers; workflow rules live outside this entity.
 */

@Entity
@Table(name = "employee_compensation")
// Hide archived rows from normal Hibernate reads.
@SQLRestriction("archived_at IS NULL")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EmployeeCompensation {

    // Database-generated primary key.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "compensation_id")
    private Long compensationId;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "pay_type", nullable = false, length = 50)
    private String payType;

    @Column(name = "hourly_rate", precision = 12, scale = 2)
    private BigDecimal hourlyRate;

    @Column(name = "annual_salary", precision = 12, scale = 2)
    private BigDecimal annualSalary;

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @Column(name = "archived_at")
    private OffsetDateTime archivedAt;

    @Column(name = "created_at", updatable = false)
    // Hibernate supplies this timestamp when inserting the record.
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    // Hibernate maintains this timestamp on entity updates.
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
