package com.dgt.backend.fuel.repository;
import com.dgt.backend.fuel.entity.FuelGrade;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for FuelGrade.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface FuelGradeRepository extends JpaRepository<FuelGrade, Long> {}
