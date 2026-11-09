package com.dgt.backend.productvendors.repository;
import com.dgt.backend.productvendors.entity.ProductVendor;
import org.springframework.data.jpa.repository.JpaRepository;
// Spring Data supplies CRUD and pagination for the product vendor link entity using a Long primary key.
public interface ProductVendorRepository extends JpaRepository<ProductVendor, Long> {}
