package com.dgt.backend.inventory.repository;
import com.dgt.backend.inventory.entity.InventoryTransfer;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for InventoryTransfer.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface InventoryTransferRepository extends JpaRepository<InventoryTransfer, Long> {}
