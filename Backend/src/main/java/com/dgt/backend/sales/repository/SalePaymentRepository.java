package com.dgt.backend.sales.repository;
import com.dgt.backend.sales.entity.SalePayment;
import org.springframework.data.jpa.repository.JpaRepository;
// Spring Data supplies CRUD and pagination for the sale payment entity using a Long primary key.
public interface SalePaymentRepository extends JpaRepository<SalePayment, Long> {}
