package com.dgt.backend.productstoreprices.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "price_groups")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
// JPA mapping for price_groups; related record IDs are scalar fields rather than entity associations.
public class PriceGroup {

    // Database-generated primary key used by the repository.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "price_group_id")
    private Long priceGroupId;

    @Column(name = "price_group_name", length = 100)
    private String priceGroupName;

    @Column(name = "description")
    private String description;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "group_price", precision = 12, scale = 2)
    // Shared group price uses two decimal places; product membership is stored separately.
    private BigDecimal groupPrice;

    @Column(name = "dgt_id", length = 50)
    private String dgtId;

    @Column(name = "created_at", updatable = false)
    // Hibernate populates this timestamp when the entity is first persisted.
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    // Hibernate refreshes this timestamp when the entity is updated.
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
