package com.dgt.backend.sales.repository;
import com.dgt.backend.sales.entity.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
// Spring Data supplies CRUD and pagination for the sale entity using a Long primary key.
public interface SaleRepository extends JpaRepository<Sale, Long> {}
