package com.dgt.backend.employees.repository;

import com.dgt.backend.employees.entity.EmployeeTimeEntry;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for EmployeeTimeEntry.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */

public interface EmployeeTimeEntryRepository extends JpaRepository<EmployeeTimeEntry, Long> {}
