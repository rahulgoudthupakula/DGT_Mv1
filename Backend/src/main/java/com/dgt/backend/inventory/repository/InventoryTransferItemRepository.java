package com.dgt.backend.inventory.repository;
import com.dgt.backend.inventory.entity.InventoryTransferItem;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for InventoryTransferItem.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface InventoryTransferItemRepository extends JpaRepository<InventoryTransferItem, Long> {}
