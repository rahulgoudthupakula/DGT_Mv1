package com.dgt.backend.employees.repository;
import com.dgt.backend.employees.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for Employee.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface EmployeeRepository extends JpaRepository<Employee, Long> {}
