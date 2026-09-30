package com.dgt.backend.vendors.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "vendor_contacts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class VendorContact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "contact_id")
    private Long contactId;

    @Column(name = "vendor_id", nullable = false)
    private Long vendorId;

    @Column(name = "dgt_id", length = 50)
    private String dgtId;

    @Column(name = "contract_number", length = 100)
    private String contractNumber;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "volume_threshold", precision = 12, scale = 2)
    private BigDecimal volumeThreshold;

    @Column(name = "volume_discount_value", precision = 12, scale = 2)
    private BigDecimal volumeDiscountValue;

    @Column(name = "volume_discount_type", length = 50)
    private String volumeDiscountType;

    @Column(name = "return_window_days")
    private Integer returnWindowDays;

    @Column(name = "status", length = 50)
    private String status;

    @Column(name = "document_url")
    private String documentUrl;

    @Column(name = "force_end_date")
    private LocalDate forceEndDate;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
