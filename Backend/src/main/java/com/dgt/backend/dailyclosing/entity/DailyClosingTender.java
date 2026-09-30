package com.dgt.backend.dailyclosing.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.SQLRestriction;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "daily_closing_tenders")
@SQLRestriction("archived_at IS NULL")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DailyClosingTender {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tender_id")
    private Long tenderId;

    @Column(name = "everyday_closing_id", nullable = false)
    private Long everydayClosingId;

    @Column(name = "tender_type", nullable = false, length = 50)
    private String tenderType;

    @Column(name = "expected_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal expectedAmount;

    @Column(name = "actual_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal actualAmount;

    @Column(name = "amount_difference", precision = 12, scale = 2)
    private BigDecimal amountDifference;

    @Column(name = "transaction_count")
    private Integer transactionCount;

    @Column(name = "archived_at")
    private OffsetDateTime archivedAt;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
