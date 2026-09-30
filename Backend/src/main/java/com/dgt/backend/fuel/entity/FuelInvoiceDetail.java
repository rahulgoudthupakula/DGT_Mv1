package com.dgt.backend.fuel.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "fuel_invoice_details")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FuelInvoiceDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "fuel_invoice_details_id")
    private Long fuelInvoiceDetailsId;

    @Column(name = "invoice_id", nullable = false)
    private Long invoiceId;

    @Column(name = "delivery_number", length = 100)
    private String deliveryNumber;

    @Column(name = "bill_of_lading_number", length = 100)
    private String billOfLadingNumber;

    @Column(name = "carrier_name", length = 100)
    private String carrierName;

    @Column(name = "delivery_date")
    private LocalDate deliveryDate;

    @Column(name = "total_gallons", precision = 12, scale = 3)
    private BigDecimal totalGallons;

    @Column(name = "fuel_subtotal", precision = 12, scale = 2)
    private BigDecimal fuelSubtotal;

    @Column(name = "freight_amount", precision = 12, scale = 2)
    private BigDecimal freightAmount;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
