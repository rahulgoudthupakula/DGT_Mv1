package com.dgt.backend.stores.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.*;

@Entity
@Table(name = "stores")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Store {

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
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
