package com.dgt.backend.sales.repository;
import com.dgt.backend.sales.entity.SaleItem;
import org.springframework.data.jpa.repository.JpaRepository;
// Spring Data supplies CRUD and pagination for the sale item entity using a Long primary key.
public interface SaleItemRepository extends JpaRepository<SaleItem, Long> {}
