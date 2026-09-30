package com.dgt.backend.inventorymovements.repository;
import com.dgt.backend.inventorymovements.entity.InventoryMovement;
import org.springframework.data.jpa.repository.JpaRepository;
public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long> {}
