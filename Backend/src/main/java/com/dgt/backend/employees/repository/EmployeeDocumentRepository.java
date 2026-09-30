package com.dgt.backend.employees.repository;
import com.dgt.backend.employees.entity.EmployeeDocument;
import org.springframework.data.jpa.repository.JpaRepository;
public interface EmployeeDocumentRepository extends JpaRepository<EmployeeDocument, Long> {}
