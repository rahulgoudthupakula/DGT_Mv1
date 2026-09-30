package com.dgt.backend.fuel.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "fuel_prices")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FuelPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "fuel_price_id")
    private Long fuelPriceId;

    @Column(name = "dgt_id", nullable = false, length = 50)
    private String dgtId;

    @Column(name = "fuel_grade_id", nullable = false)
    private Long fuelGradeId;

    @Column(name = "cash_price", nullable = false, precision = 12, scale = 4)
    private BigDecimal cashPrice;

    @Column(name = "credit_price", nullable = false, precision = 12, scale = 4)
    private BigDecimal creditPrice;

    @Column(name = "effective_from", nullable = false)
    private OffsetDateTime effectiveFrom;

    @Column(name = "effective_to")
    private OffsetDateTime effectiveTo;

    @Column(name = "changed_by")
    private Long changedBy;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
