package com.dgt.backend.productstoreprices.repository;
import com.dgt.backend.productstoreprices.entity.ProductPriceGroup;
import org.springframework.data.jpa.repository.JpaRepository;
// Spring Data supplies CRUD and pagination for the product price-group link entity using a Long primary key.
public interface ProductPriceGroupRepository extends JpaRepository<ProductPriceGroup, Long> {}
