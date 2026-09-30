package com.dgt.backend.invoices.repository;
import com.dgt.backend.invoices.entity.GroceryInvoiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
public interface GroceryInvoiceItemRepository extends JpaRepository<GroceryInvoiceItem, Long> {}
