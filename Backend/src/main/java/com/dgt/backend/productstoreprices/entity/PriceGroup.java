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
public class PriceGroup {

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
    private BigDecimal groupPrice;

    @Column(name = "dgt_id", length = 50)
    private String dgtId;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
