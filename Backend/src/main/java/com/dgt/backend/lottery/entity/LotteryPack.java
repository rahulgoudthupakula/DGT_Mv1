package com.dgt.backend.lottery.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.*;

@Entity
@Table(name = "lottery_packs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LotteryPack {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "lottery_pack_id")
    private Long lotteryPackId;

    @Column(name = "invoice_id")
    private Long invoiceId;

    @Column(name = "dgt_id", nullable = false, length = 50)
    private String dgtId;

    @Column(name = "vendor_id")
    private Long vendorId;

    @Column(name = "start_ticket_number")
    private Integer startTicketNumber;

    @Column(name = "end_ticket_number")
    private Integer endTicketNumber;

    @Column(name = "total_tickets")
    private Integer totalTickets;

    @Column(name = "status_id")
    private Long statusId;

    @Column(name = "return_date")
    private OffsetDateTime returnDate;

    @Column(name = "performed_by")
    private Long performedBy;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
