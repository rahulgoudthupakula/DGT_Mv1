package com.dgt.backend.employees.repository;
import com.dgt.backend.employees.entity.EmployeeCompensation;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for EmployeeCompensation.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface EmployeeCompensationRepository extends JpaRepository<EmployeeCompensation, Long> {}
