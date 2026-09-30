package com.dgt.backend.lottery.entity;

import com.dgt.backend.common.converter.JsonNodeConverter;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "lottery_settlements")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LotterySettlement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "lottery_settlement_id")
    private Long lotterySettlementId;

    @Column(name = "dgt_id", nullable = false, length = 50)
    private String dgtId;

    @Column(name = "vendor_id")
    private Long vendorId;

    @Column(name = "settlement_reference", length = 100)
    private String settlementReference;

    @Convert(converter = JsonNodeConverter.class)
    @Column(name = "period_type", columnDefinition = "jsonb")
    private JsonNode periodType;

    @Column(name = "period_start_date")
    private LocalDate periodStartDate;

    @Column(name = "period_end_date")
    private LocalDate periodEndDate;

    @Column(name = "total_sales", precision = 12, scale = 2)
    private BigDecimal totalSales;

    @Column(name = "total_commission", precision = 12, scale = 2)
    private BigDecimal totalCommission;

    @Column(name = "status_type_id")
    private Long statusTypeId;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "paid_at")
    private OffsetDateTime paidAt;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
