package com.dgt.backend.dailyclosing.repository;
import com.dgt.backend.dailyclosing.entity.DailyExpense;
import org.springframework.data.jpa.repository.JpaRepository;
public interface DailyExpenseRepository extends JpaRepository<DailyExpense, Long> {}
