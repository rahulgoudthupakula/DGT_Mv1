package com.dgt.backend.dailyclosing.repository;
import com.dgt.backend.dailyclosing.entity.EverydayClosing;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Inherited JPA CRUD and pagination for EverydayClosing.
 * No store predicate is added by this repository; entity restrictions still apply.
 */
public interface EverydayClosingRepository extends JpaRepository<EverydayClosing, Long> {}
