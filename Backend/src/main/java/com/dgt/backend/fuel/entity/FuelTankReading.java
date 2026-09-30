package com.dgt.backend.fuel.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "fuel_tank_readings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FuelTankReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tank_reading_id")
    private Long tankReadingId;

    @Column(name = "tank_id", nullable = false)
    private Long tankId;

    @Column(name = "reading_datetime", nullable = false)
    private OffsetDateTime readingDatetime;

    @Column(name = "volume_gallons", nullable = false, precision = 12, scale = 3)
    private BigDecimal volumeGallons;

    @Column(name = "temperature", precision = 8, scale = 2)
    private BigDecimal temperature;

    @Column(name = "ullage", precision = 12, scale = 3)
    private BigDecimal ullage;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;
}
