package com.dgt.backend.lottery.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.*;

/**
 * JPA mapping of lottery_pack_inventory.
 * Stores record fields and scalar relationship identifiers; workflow rules live outside this entity.
 */

@Entity
@Table(name = "lottery_pack_inventory")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LotteryPackInventory {

    // Database-generated primary key.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "lottery_pack_inventory_id")
    private Long lotteryPackInventoryId;

    @Column(name = "dgt_id", nullable = false, length = 50)
    private String dgtId;

    @Column(name = "shift_opened_by")
    private Long shiftOpenedBy;

    @Column(name = "shift_opened_at")
    private OffsetDateTime shiftOpenedAt;

    @Column(name = "shift_closed_at")
    private OffsetDateTime shiftClosedAt;

    @Column(name = "created_at", updatable = false)
    // Hibernate supplies this timestamp when inserting the record.
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    // Hibernate maintains this timestamp on entity updates.
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
