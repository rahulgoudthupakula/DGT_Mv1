package com.dgt.backend.departments.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.*;

/**
 * JPA mapping of store_sub_departments.
 * Stores record fields and scalar relationship identifiers; workflow rules live outside this entity.
 */

@Entity
@Table(name = "store_sub_departments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StoreSubDepartment {

    // Database-generated primary key.
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
    // Hibernate supplies this timestamp when inserting the record.
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    // Hibernate maintains this timestamp on entity updates.
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
