package com.dgt.backend.employees.entity;

import com.dgt.backend.common.converter.JsonNodeConverter;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "employee_time_off_requests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EmployeeTimeOffRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "time_off_request_id")
    private Long timeOffRequestId;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Convert(converter = JsonNodeConverter.class)
    @Column(name = "request_type", columnDefinition = "jsonb")
    private JsonNode requestType;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "hours_requested", precision = 8, scale = 2)
    private BigDecimal hoursRequested;

    @Column(name = "reason")
    private String reason;

    @Column(name = "status_type_id")
    private Long statusTypeId;

    @Column(name = "requested_at")
    private OffsetDateTime requestedAt;

    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "reviewed_at")
    private OffsetDateTime reviewedAt;

    @Column(name = "rejected_reason")
    private String rejectedReason;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
