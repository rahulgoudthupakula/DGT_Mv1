package com.dgt.backend.dailyclosing.repository;
import com.dgt.backend.dailyclosing.entity.DailyExpense;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Inherited JPA CRUD and pagination for DailyExpense.
 * No store predicate is added by this repository; entity restrictions still apply.
 */
public interface DailyExpenseRepository extends JpaRepository<DailyExpense, Long> {}
