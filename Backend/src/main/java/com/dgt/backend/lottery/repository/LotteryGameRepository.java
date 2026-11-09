package com.dgt.backend.lottery.repository;
import com.dgt.backend.lottery.entity.LotteryGame;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for LotteryGame.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface LotteryGameRepository extends JpaRepository<LotteryGame, Long> {}
