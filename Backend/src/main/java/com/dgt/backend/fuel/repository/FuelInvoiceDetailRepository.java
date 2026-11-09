package com.dgt.backend.fuel.repository;
import com.dgt.backend.fuel.entity.FuelInvoiceDetail;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for FuelInvoiceDetail.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface FuelInvoiceDetailRepository extends JpaRepository<FuelInvoiceDetail, Long> {}
