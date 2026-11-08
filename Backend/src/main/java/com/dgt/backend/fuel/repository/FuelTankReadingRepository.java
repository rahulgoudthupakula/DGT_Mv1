package com.dgt.backend.fuel.repository;
import com.dgt.backend.fuel.entity.FuelTankReading;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for FuelTankReading.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface FuelTankReadingRepository extends JpaRepository<FuelTankReading, Long> {}
