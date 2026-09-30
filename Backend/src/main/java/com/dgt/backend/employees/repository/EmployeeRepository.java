package com.dgt.backend.employees.repository;
import com.dgt.backend.employees.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
public interface EmployeeRepository extends JpaRepository<Employee, Long> {}
