package com.dgt.backend.fuel.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "fuel_invoice_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FuelInvoiceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "fuel_invoice_item_id")
    private Long fuelInvoiceItemId;

    @Column(name = "invoice_id", nullable = false)
    private Long invoiceId;

    @Column(name = "fuel_grade_id", nullable = false)
    private Long fuelGradeId;

    @Column(name = "gross_gallons", nullable = false, precision = 12, scale = 3)
    private BigDecimal grossGallons;

    @Column(name = "net_gallons", nullable = false, precision = 12, scale = 3)
    private BigDecimal netGallons;

    @Column(name = "price_per_gallon", nullable = false, precision = 12, scale = 4)
    private BigDecimal pricePerGallon;

    @Column(name = "fuel_line_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal fuelLineTotal;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;
}
