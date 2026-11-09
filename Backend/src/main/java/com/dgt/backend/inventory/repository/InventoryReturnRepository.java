package com.dgt.backend.inventory.repository;
import com.dgt.backend.inventory.entity.InventoryReturn;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for InventoryReturn.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface InventoryReturnRepository extends JpaRepository<InventoryReturn, Long> {}
