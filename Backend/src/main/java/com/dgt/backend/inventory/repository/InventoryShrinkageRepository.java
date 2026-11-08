package com.dgt.backend.inventory.repository;
import com.dgt.backend.inventory.entity.InventoryShrinkage;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for InventoryShrinkage.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface InventoryShrinkageRepository extends JpaRepository<InventoryShrinkage, Long> {}
