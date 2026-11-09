package com.dgt.backend.stores.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.*;

@Entity
@Table(name = "stores")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
// JPA mapping for stores; related record IDs are scalar fields rather than entity associations.
public class Store {

    // Store DGT identifier is the assigned string primary key.
    @Id
    @Column(name = "dgt_id")
    private String dgtId;

    @Column(name = "store_id", length = 50)
    private String storeId;

    @Column(name = "store_name", nullable = false, length = 200)
    private String storeName;

    @Column(name = "legal_business_name", length = 200)
    private String legalBusinessName;

    @Column(name = "tax_id", length = 50)
    private String taxId;

    @Column(name = "license_number", length = 100)
    private String licenseNumber;

    @Column(name = "timezone", length = 50)
    private String timezone;

    @Column(name = "company_id")
    private Long companyId;

    @Column(name = "created_at", updatable = false)
    // Hibernate populates this timestamp when the entity is first persisted.
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    // Hibernate refreshes this timestamp when the entity is updated.
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
