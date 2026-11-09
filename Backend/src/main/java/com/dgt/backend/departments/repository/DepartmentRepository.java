package com.dgt.backend.departments.repository;
import com.dgt.backend.departments.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for Department.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface DepartmentRepository extends JpaRepository<Department, Long> {}
