package com.dgt.backend.vendors.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "vendor_item_cost_history")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
// JPA mapping for vendor_item_cost_history; related record IDs are scalar fields rather than entity associations.
public class VendorItemCostHistory {

    // Database-generated primary key used by the repository.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cost_history_id")
    private Long costHistoryId;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "vendor_id")
    private Long vendorId;

    @Column(name = "old_cost", precision = 12, scale = 4)
    private BigDecimal oldCost;

    @Column(name = "new_cost", precision = 12, scale = 4)
    private BigDecimal newCost;

    @Column(name = "change_percentage", precision = 8, scale = 4)
    private BigDecimal changePercentage;

    @Column(name = "effective_date")
    private LocalDate effectiveDate;

    @Column(name = "change_source", length = 50)
    private String changeSource;

    @Column(name = "changed_by")
    private Long changedBy;

    @Column(name = "created_date", updatable = false)
    // Hibernate populates this timestamp when the entity is first persisted.
    @CreationTimestamp
    private OffsetDateTime createdDate;

    @Column(name = "updated_date")
    // Hibernate refreshes this timestamp when the entity is updated.
    @UpdateTimestamp
    private OffsetDateTime updatedDate;
}
