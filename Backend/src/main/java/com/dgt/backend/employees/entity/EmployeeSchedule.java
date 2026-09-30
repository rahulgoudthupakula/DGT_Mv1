package com.dgt.backend.employees.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.*;

@Entity
@Table(name = "employee_schedules")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EmployeeSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "schedule_id")
    private Long scheduleId;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "dgt_id", nullable = false, length = 50)
    private String dgtId;

    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Column(name = "schedule_start")
    private OffsetDateTime scheduleStart;

    @Column(name = "schedule_end")
    private OffsetDateTime scheduleEnd;

    @Column(name = "status", nullable = false, length = 50)
    private String status;

    @Column(name = "notes")
    private String notes;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
