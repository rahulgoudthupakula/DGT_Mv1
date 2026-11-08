package com.dgt.backend.lottery.repository;
import com.dgt.backend.lottery.entity.LotteryPackInventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for LotteryPackInventoryItem.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface LotteryPackInventoryItemRepository extends JpaRepository<LotteryPackInventoryItem, Long> {}
