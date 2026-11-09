package com.dgt.backend.vendors.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.*;

@Entity
@Table(name = "vendors")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
// JPA mapping for vendors; related record IDs are scalar fields rather than entity associations.
public class Vendor {

    // Database-generated primary key used by the repository.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "vendor_id")
    private Long vendorId;

    @Column(name = "vendor_name", nullable = false, length = 200)
    private String vendorName;

    @Column(name = "email", length = 200)
    private String email;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(name = "website_url")
    private String websiteUrl;

    @Column(name = "payment_terms", length = 100)
    private String paymentTerms;

    @Column(name = "lead_time_days")
    private Integer leadTimeDays;

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
