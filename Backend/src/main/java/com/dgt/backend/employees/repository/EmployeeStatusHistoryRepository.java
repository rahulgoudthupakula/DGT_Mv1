package com.dgt.backend.employees.repository;
import com.dgt.backend.employees.entity.EmployeeStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for EmployeeStatusHistory.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface EmployeeStatusHistoryRepository extends JpaRepository<EmployeeStatusHistory, Long> {}
