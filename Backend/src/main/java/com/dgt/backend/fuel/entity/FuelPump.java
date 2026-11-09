package com.dgt.backend.fuel.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.*;

/**
 * JPA mapping of fuel_pumps.
 * Stores record fields and scalar relationship identifiers; workflow rules live outside this entity.
 */

@Entity
@Table(name = "fuel_pumps")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FuelPump {

    // Database-generated primary key.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pump_id")
    private Long pumpId;

    @Column(name = "dgt_id", nullable = false, length = 50)
    private String dgtId;

    @Column(name = "pump_number", nullable = false, length = 20)
    private String pumpNumber;

    @Column(name = "status", nullable = false, length = 50)
    private String status;

    @Column(name = "serial_number", length = 100)
    private String serialNumber;

    @Column(name = "created_at", updatable = false)
    // Hibernate supplies this timestamp when inserting the record.
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    // Hibernate maintains this timestamp on entity updates.
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
