package com.dgt.backend.employees.repository;
import com.dgt.backend.employees.entity.EmployeeStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
public interface EmployeeStatusHistoryRepository extends JpaRepository<EmployeeStatusHistory, Long> {}
