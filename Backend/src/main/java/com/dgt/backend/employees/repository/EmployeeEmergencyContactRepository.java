package com.dgt.backend.employees.repository;
import com.dgt.backend.employees.entity.EmployeeEmergencyContact;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for EmployeeEmergencyContact.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface EmployeeEmergencyContactRepository extends JpaRepository<EmployeeEmergencyContact, Long> {}
