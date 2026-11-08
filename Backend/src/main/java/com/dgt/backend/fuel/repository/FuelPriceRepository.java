package com.dgt.backend.fuel.repository;
import com.dgt.backend.fuel.entity.FuelPrice;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for FuelPrice.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface FuelPriceRepository extends JpaRepository<FuelPrice, Long> {}
