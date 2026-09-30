package com.dgt.backend.fuel.repository;
import com.dgt.backend.fuel.entity.FuelInvoiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
public interface FuelInvoiceItemRepository extends JpaRepository<FuelInvoiceItem, Long> {}
