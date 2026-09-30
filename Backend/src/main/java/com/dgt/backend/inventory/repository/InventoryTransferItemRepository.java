package com.dgt.backend.inventory.repository;
import com.dgt.backend.inventory.entity.InventoryTransferItem;
import org.springframework.data.jpa.repository.JpaRepository;
public interface InventoryTransferItemRepository extends JpaRepository<InventoryTransferItem, Long> {}
