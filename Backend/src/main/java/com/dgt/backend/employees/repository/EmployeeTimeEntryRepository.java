package com.dgt.backend.employees.repository;

import com.dgt.backend.employees.entity.EmployeeTimeEntry;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmployeeTimeEntryRepository extends JpaRepository<EmployeeTimeEntry, Long> {}
