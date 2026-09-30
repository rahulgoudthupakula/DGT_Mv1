package com.dgt.backend.sales.repository;
import com.dgt.backend.sales.entity.SalePayment;
import org.springframework.data.jpa.repository.JpaRepository;
public interface SalePaymentRepository extends JpaRepository<SalePayment, Long> {}
