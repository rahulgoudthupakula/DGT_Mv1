package com.dgt.backend.fuel.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.*;

/**
 * JPA mapping of fuel_tanks.
 * Stores record fields and scalar relationship identifiers; workflow rules live outside this entity.
 */

@Entity
@Table(name = "fuel_tanks")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FuelTank {

    // Database-generated primary key.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tank_id")
    private Long tankId;

    @Column(name = "dgt_id", nullable = false, length = 50)
    private String dgtId;

    @Column(name = "tank_number", nullable = false, length = 20)
    private String tankNumber;

    @Column(name = "tank_name", length = 100)
    private String tankName;

    @Column(name = "capacity_gallons", precision = 12, scale = 3)
    private BigDecimal capacityGallons;

    @Column(name = "safe_fill_capacity", precision = 12, scale = 3)
    private BigDecimal safeFillCapacity;

    @Column(name = "created_at", updatable = false)
    // Hibernate supplies this timestamp when inserting the record.
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    // Hibernate maintains this timestamp on entity updates.
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
