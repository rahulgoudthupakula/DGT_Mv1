package com.dgt.backend.fuel.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "fuel_grades")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FuelGrade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "fuel_grade_id")
    private Long fuelGradeId;

    @Column(name = "fuel_type", nullable = false, length = 50)
    private String fuelType;

    @Column(name = "grade_name", nullable = false, length = 100)
    private String gradeName;

    @Column(name = "octane_rating", precision = 5, scale = 1)
    private BigDecimal octaneRating;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
