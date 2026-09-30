package com.dgt.backend.departments.repository;
import com.dgt.backend.departments.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
public interface DepartmentRepository extends JpaRepository<Department, Long> {}
