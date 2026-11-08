package com.dgt.backend.sales.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.*;

@Entity
@Table(name = "tender_types")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
// JPA mapping for tender_types; related record IDs are scalar fields rather than entity associations.
public class TenderType {

    // Database-generated primary key used by the repository.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tender_type_id")
    private Long tenderTypeId;

    @Column(name = "tender_code", nullable = false, length = 50)
    private String tenderCode;

    @Column(name = "tender_name", nullable = false, length = 100)
    private String tenderName;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "created_at", updatable = false)
    // Hibernate populates this timestamp when the entity is first persisted.
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    // Hibernate refreshes this timestamp when the entity is updated.
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
