package com.dgt.backend.dailyclosing.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.SQLRestriction;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "daily_closing_deposits")
@SQLRestriction("archived_at IS NULL")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DailyClosingDeposit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "deposit_id")
    private Long depositId;

    @Column(name = "everyday_closing_id", nullable = false)
    private Long everydayClosingId;

    @Column(name = "deposit_date", nullable = false)
    private LocalDate depositDate;

    @Column(name = "bank_account_id")
    private Long bankAccountId;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "receipt_url")
    private String receiptUrl;

    @Column(name = "deposited_by")
    private Long depositedBy;

    @Column(name = "status", nullable = false, length = 50)
    private String status;

    @Column(name = "archived_at")
    private OffsetDateTime archivedAt;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
