package com.dgt.backend.inventory.repository;
import com.dgt.backend.inventory.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for Inventory.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface InventoryRepository extends JpaRepository<Inventory, Long> {}
