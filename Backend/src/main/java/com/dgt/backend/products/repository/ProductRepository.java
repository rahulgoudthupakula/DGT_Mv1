package com.dgt.backend.products.repository;
import com.dgt.backend.products.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
// Spring Data supplies CRUD and pagination for the product entity using a Long primary key.
public interface ProductRepository extends JpaRepository<Product, Long> {}
