package com.dgt.backend.employees.repository;
import com.dgt.backend.employees.entity.EmployeeSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for EmployeeSchedule.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface EmployeeScheduleRepository extends JpaRepository<EmployeeSchedule, Long> {}
