package com.dgt.backend.inventory.repository;
import com.dgt.backend.inventory.entity.InventoryShrinkageItem;
import org.springframework.data.jpa.repository.JpaRepository;
public interface InventoryShrinkageItemRepository extends JpaRepository<InventoryShrinkageItem, Long> {}
