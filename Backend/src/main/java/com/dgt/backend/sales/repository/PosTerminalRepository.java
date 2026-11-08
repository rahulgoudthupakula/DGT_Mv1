package com.dgt.backend.sales.repository;
import com.dgt.backend.sales.entity.PosTerminal;
import org.springframework.data.jpa.repository.JpaRepository;
// Spring Data supplies CRUD and pagination for the POS terminal entity using a Long primary key.
public interface PosTerminalRepository extends JpaRepository<PosTerminal, Long> {}
