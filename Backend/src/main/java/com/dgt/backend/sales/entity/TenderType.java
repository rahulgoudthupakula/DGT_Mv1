package com.dgt.backend.sales.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.*;

@Entity
@Table(name = "tender_types")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TenderType {

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
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
