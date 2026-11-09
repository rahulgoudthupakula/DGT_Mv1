package com.dgt.backend.employees.repository;
import com.dgt.backend.employees.entity.EmployeeDocument;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for EmployeeDocument.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface EmployeeDocumentRepository extends JpaRepository<EmployeeDocument, Long> {}
