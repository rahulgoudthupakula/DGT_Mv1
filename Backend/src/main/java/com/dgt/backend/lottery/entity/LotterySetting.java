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
@Table(name = "lottery_settings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LotterySetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "lottery_setting_id")
    private Long lotterySettingId;

    @Column(name = "dgt_id", nullable = false, length = 50)
    private String dgtId;

    @Column(name = "max_open_packs_per_game")
    private Integer maxOpenPacksPerGame;

    @Column(name = "allow_partial_returns")
    private Boolean allowPartialReturns;

    @Column(name = "default_commission_per_pack", precision = 12, scale = 2)
    private BigDecimal defaultCommissionPerPack;

    @Convert(converter = JsonNodeConverter.class)
    @Column(name = "settlement_frequency", columnDefinition = "jsonb")
    private JsonNode settlementFrequency;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
