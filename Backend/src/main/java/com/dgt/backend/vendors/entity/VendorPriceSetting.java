package com.dgt.backend.vendors.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "vendor_price_settings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class VendorPriceSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "setting_id")
    private Long settingId;

    @Column(name = "dgt_id", nullable = false, length = 50)
    private String dgtId;

    @Column(name = "price_change_alert_enabled")
    private Boolean priceChangeAlertEnabled;

    @Column(name = "alert_threshold_percentage", precision = 8, scale = 4)
    private BigDecimal alertThresholdPercentage;

    @Column(name = "approval_required")
    private Boolean approvalRequired;

    @Column(name = "permission_id")
    private Long permissionId;

    @Column(name = "approval_threshold_percentage", precision = 8, scale = 4)
    private BigDecimal approvalThresholdPercentage;

    @Column(name = "auto_pick_preferred_vendor")
    private Boolean autoPickPreferredVendor;

    @Column(name = "use_fallback_vendor")
    private Boolean useFallbackVendor;

    @Column(name = "consider_lead_time")
    private Boolean considerLeadTime;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
