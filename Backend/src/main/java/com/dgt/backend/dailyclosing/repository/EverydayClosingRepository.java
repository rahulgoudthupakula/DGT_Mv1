package com.dgt.backend.dailyclosing.repository;
import com.dgt.backend.dailyclosing.entity.EverydayClosing;
import org.springframework.data.jpa.repository.JpaRepository;
public interface EverydayClosingRepository extends JpaRepository<EverydayClosing, Long> {}
