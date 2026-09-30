package com.dgt.backend.lottery.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "lottery_games")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LotteryGame {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "lottery_game_id")
    private Long lotteryGameId;

    @Column(name = "dgt_id", nullable = false, length = 50)
    private String dgtId;

    @Column(name = "game_code", length = 50)
    private String gameCode;

    @Column(name = "game_name", length = 100)
    private String gameName;

    @Column(name = "ticket_price", precision = 12, scale = 2)
    private BigDecimal ticketPrice;

    @Column(name = "tickets_per_pack")
    private Integer ticketsPerPack;

    @Column(name = "pack_value", precision = 12, scale = 2)
    private BigDecimal packValue;

    @Column(name = "commission_percent", precision = 8, scale = 4)
    private BigDecimal commissionPercent;

    @Column(name = "status", length = 50)
    private String status;

    @Column(name = "pack_number", length = 100)
    private String packNumber;

    @Column(name = "barcode", length = 100)
    private String barcode;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
