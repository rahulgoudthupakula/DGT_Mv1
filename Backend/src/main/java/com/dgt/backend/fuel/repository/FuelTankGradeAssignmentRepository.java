package com.dgt.backend.fuel.repository;
import com.dgt.backend.fuel.entity.FuelTankGradeAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for FuelTankGradeAssignment.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface FuelTankGradeAssignmentRepository extends JpaRepository<FuelTankGradeAssignment, Long> {}
