package com.dgt.backend.departments.repository;
import com.dgt.backend.departments.entity.StoreSubDepartment;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for StoreSubDepartment.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface StoreSubDepartmentRepository extends JpaRepository<StoreSubDepartment, Long> {}
