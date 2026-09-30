package com.dgt.backend.lottery.repository;
import com.dgt.backend.lottery.entity.LotteryGame;
import org.springframework.data.jpa.repository.JpaRepository;
public interface LotteryGameRepository extends JpaRepository<LotteryGame, Long> {}
