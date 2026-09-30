package com.dgt.backend.lottery.repository;
import com.dgt.backend.lottery.entity.LotterySetting;
import org.springframework.data.jpa.repository.JpaRepository;
public interface LotterySettingRepository extends JpaRepository<LotterySetting, Long> {}
