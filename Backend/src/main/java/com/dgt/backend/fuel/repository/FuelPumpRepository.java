package com.dgt.backend.fuel.repository;
import com.dgt.backend.fuel.entity.FuelPump;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for FuelPump.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface FuelPumpRepository extends JpaRepository<FuelPump, Long> {}
