package com.dgt.backend.lottery.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "lottery_pack_inventory_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LotteryPackInventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "lottery_pack_inventory_item_id")
    private Long lotteryPackInventoryItemId;

    @Column(name = "lottery_pack_inventory_id", nullable = false)
    private Long lotteryPackInventoryId;

    @Column(name = "open_ticket_number")
    private Integer openTicketNumber;

    @Column(name = "last_sold_ticket_number")
    private Integer lastSoldTicketNumber;

    @Column(name = "physical_quantity")
    private Integer physicalQuantity;

    @Column(name = "pack_id")
    private Long packId;

    @Column(name = "commission_amount", precision = 12, scale = 2)
    private BigDecimal commissionAmount;

    @Column(name = "expected_cash", precision = 12, scale = 2)
    private BigDecimal expectedCash;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
