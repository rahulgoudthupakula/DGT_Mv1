package com.dgt.backend.dailyclosing.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "everyday_closing")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EverydayClosing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "everyday_closing_id")
    private Long everydayClosingId;

    @Column(name = "dgt_id", nullable = false, length = 50)
    private String dgtId;

    @Column(name = "opening_datetime", nullable = false)
    private OffsetDateTime openingDatetime;

    @Column(name = "closing_datetime")
    private OffsetDateTime closingDatetime;

    @Column(name = "total_gross_sales", precision = 12, scale = 2)
    private BigDecimal totalGrossSales;

    @Column(name = "total_discounts", precision = 12, scale = 2)
    private BigDecimal totalDiscounts;

    @Column(name = "total_tax", precision = 12, scale = 2)
    private BigDecimal totalTax;

    @Column(name = "total_net_sales", precision = 12, scale = 2)
    private BigDecimal totalNetSales;

    @Column(name = "total_refunds", precision = 12, scale = 2)
    private BigDecimal totalRefunds;

    @Column(name = "expected_cash", precision = 12, scale = 2)
    private BigDecimal expectedCash;

    @Column(name = "actual_cash", precision = 12, scale = 2)
    private BigDecimal actualCash;

    @Column(name = "cash_variance", precision = 12, scale = 2)
    private BigDecimal cashVariance;

    @Column(name = "total_deposits", precision = 12, scale = 2)
    private BigDecimal totalDeposits;

    @Column(name = "closed_by")
    private Long closedBy;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
