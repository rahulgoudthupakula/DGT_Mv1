package com.dgt.backend.fuel.repository;
import com.dgt.backend.fuel.entity.FuelInvoiceItem;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for FuelInvoiceItem.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface FuelInvoiceItemRepository extends JpaRepository<FuelInvoiceItem, Long> {}
