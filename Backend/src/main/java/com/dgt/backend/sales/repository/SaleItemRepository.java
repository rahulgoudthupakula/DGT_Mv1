package com.dgt.backend.sales.repository;
import com.dgt.backend.sales.entity.SaleItem;
import org.springframework.data.jpa.repository.JpaRepository;
public interface SaleItemRepository extends JpaRepository<SaleItem, Long> {}
