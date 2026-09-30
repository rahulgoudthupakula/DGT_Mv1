package com.dgt.backend.inventory.repository;
import com.dgt.backend.inventory.entity.InventoryReductionRequest;
import org.springframework.data.jpa.repository.JpaRepository;
public interface InventoryReductionRequestRepository extends JpaRepository<InventoryReductionRequest, Long> {}
