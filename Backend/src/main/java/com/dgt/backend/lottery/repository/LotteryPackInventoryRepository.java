package com.dgt.backend.lottery.repository;
import com.dgt.backend.lottery.entity.LotteryPackInventory;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for LotteryPackInventory.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface LotteryPackInventoryRepository extends JpaRepository<LotteryPackInventory, Long> {}
