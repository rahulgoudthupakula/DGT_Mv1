package com.dgt.backend.dailyclosing.repository;
import com.dgt.backend.dailyclosing.entity.DailyClosingDeposit;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Inherited JPA CRUD and pagination for DailyClosingDeposit.
 * No store predicate is added by this repository; entity restrictions still apply.
 */
public interface DailyClosingDepositRepository extends JpaRepository<DailyClosingDeposit, Long> {}
