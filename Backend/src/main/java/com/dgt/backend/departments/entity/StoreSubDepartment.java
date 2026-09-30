package com.dgt.backend.departments.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.*;

@Entity
@Table(name = "store_sub_departments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StoreSubDepartment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "store_sub_department_id")
    private Long storeSubDepartmentId;

    @Column(name = "store_department_id", nullable = false)
    private Long storeDepartmentId;

    @Column(name = "store_sub_department_name", nullable = false, length = 100)
    private String storeSubDepartmentName;

    @Column(name = "is_taxable")
    private Boolean isTaxable;

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
