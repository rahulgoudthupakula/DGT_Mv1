package com.dgt.backend.inventory.repository;
import com.dgt.backend.inventory.entity.InventoryShrinkageItem;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for InventoryShrinkageItem.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface InventoryShrinkageItemRepository extends JpaRepository<InventoryShrinkageItem, Long> {}
