package com.dgt.backend.lottery.repository;
import com.dgt.backend.lottery.entity.LotterySetting;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for LotterySetting.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface LotterySettingRepository extends JpaRepository<LotterySetting, Long> {}
