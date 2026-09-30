package com.dgt.backend.employees.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "employee_time_entries")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EmployeeTimeEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "time_entry_id")
    private Long timeEntryId;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "dgt_id", nullable = false, length = 50)
    private String dgtId;

    @Column(name = "clock_in", nullable = false)
    private OffsetDateTime clockIn;

    @Column(name = "clock_out")
    private OffsetDateTime clockOut;

    @Column(name = "regular_hours", precision = 8, scale = 2)
    private BigDecimal regularHours;

    @Column(name = "overtime_hours", precision = 8, scale = 2)
    private BigDecimal overtimeHours;

    @Column(name = "event_type", length = 50)
    private String eventType;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
