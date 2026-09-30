package com.dgt.backend.productvendors.repository;
import com.dgt.backend.productvendors.entity.ProductVendor;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ProductVendorRepository extends JpaRepository<ProductVendor, Long> {}
