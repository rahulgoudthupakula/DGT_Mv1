package com.dgt.backend.employees.repository;
import com.dgt.backend.employees.entity.EmployeeTimeOffRequest;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for EmployeeTimeOffRequest.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface EmployeeTimeOffRequestRepository extends JpaRepository<EmployeeTimeOffRequest, Long> {}
