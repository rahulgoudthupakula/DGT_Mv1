package com.dgt.backend.employees.repository;
import com.dgt.backend.employees.entity.EmployeeStoreAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for EmployeeStoreAssignment.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface EmployeeStoreAssignmentRepository extends JpaRepository<EmployeeStoreAssignment, Long> {}
