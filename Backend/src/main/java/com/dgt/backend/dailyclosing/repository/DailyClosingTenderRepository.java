package com.dgt.backend.dailyclosing.repository;
import com.dgt.backend.dailyclosing.entity.DailyClosingTender;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Inherited JPA CRUD and pagination for DailyClosingTender.
 * No store predicate is added by this repository; entity restrictions still apply.
 */
public interface DailyClosingTenderRepository extends JpaRepository<DailyClosingTender, Long> {}
