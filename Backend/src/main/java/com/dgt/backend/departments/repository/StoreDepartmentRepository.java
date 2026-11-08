package com.dgt.backend.departments.repository;
import com.dgt.backend.departments.entity.StoreDepartment;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for StoreDepartment.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface StoreDepartmentRepository extends JpaRepository<StoreDepartment, Long> {}
