package com.dgt.backend.lottery.repository;
import com.dgt.backend.lottery.entity.LotteryPack;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for LotteryPack.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface LotteryPackRepository extends JpaRepository<LotteryPack, Long> {}
