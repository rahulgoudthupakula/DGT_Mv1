package com.dgt.backend.departments.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.*;

@Entity
@Table(name = "store_departments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StoreDepartment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "store_department_id")
    private Long storeDepartmentId;

    @Column(name = "dgt_id", nullable = false, length = 50)
    private String dgtId;

    @Column(name = "department_id")
    private Long departmentId;

    @Column(name = "store_department_name", nullable = false, length = 100)
    private String storeDepartmentName;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "source_type", length = 20)
    private String sourceType;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
