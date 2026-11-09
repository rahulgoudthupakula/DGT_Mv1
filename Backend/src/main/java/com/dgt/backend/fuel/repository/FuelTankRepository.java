package com.dgt.backend.fuel.repository;
import com.dgt.backend.fuel.entity.FuelTank;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for FuelTank.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface FuelTankRepository extends JpaRepository<FuelTank, Long> {}
