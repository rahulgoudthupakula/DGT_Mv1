package com.dgt.backend.lottery.repository;
import com.dgt.backend.lottery.entity.LotterySettlement;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for LotterySettlement.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface LotterySettlementRepository extends JpaRepository<LotterySettlement, Long> {}
