package com.dgt.backend.dailyclosing.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.SQLRestriction;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "daily_expenses")
@SQLRestriction("archived_at IS NULL")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DailyExpense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "expenses_id")
    private Long expensesId;

    @Column(name = "everyday_closing_id", nullable = false)
    private Long everydayClosingId;

    @Column(name = "expenses_date", nullable = false)
    private LocalDate expensesDate;

    @Column(name = "expenses_type", nullable = false, length = 50)
    private String expensesType;

    @Column(name = "description")
    private String description;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "paid_by")
    private Long paidBy;

    @Column(name = "receipt_number", length = 100)
    private String receiptNumber;

    @Column(name = "archived_at")
    private OffsetDateTime archivedAt;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
