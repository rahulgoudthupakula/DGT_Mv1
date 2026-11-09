package com.dgt.backend.inventory.repository;
import com.dgt.backend.inventory.entity.InventoryReductionRequest;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for InventoryReductionRequest.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface InventoryReductionRequestRepository extends JpaRepository<InventoryReductionRequest, Long> {}
