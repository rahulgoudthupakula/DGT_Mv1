package com.dgt.backend.inventorymovements.repository;
import com.dgt.backend.inventorymovements.entity.InventoryMovement;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for InventoryMovement.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long> {}
