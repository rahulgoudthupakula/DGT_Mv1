package com.dgt.backend.products.repository;
import com.dgt.backend.products.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ProductRepository extends JpaRepository<Product, Long> {}
