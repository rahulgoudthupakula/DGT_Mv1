package com.dgt.backend.inventory.repository;
import com.dgt.backend.inventory.entity.InventoryReturnItem;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for InventoryReturnItem.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface InventoryReturnItemRepository extends JpaRepository<InventoryReturnItem, Long> {}
