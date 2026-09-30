package com.dgt.backend.inventory.repository;
import com.dgt.backend.inventory.entity.InventoryReturnItem;
import org.springframework.data.jpa.repository.JpaRepository;
public interface InventoryReturnItemRepository extends JpaRepository<InventoryReturnItem, Long> {}
