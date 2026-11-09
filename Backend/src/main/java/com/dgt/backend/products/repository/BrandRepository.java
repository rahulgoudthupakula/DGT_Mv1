package com.dgt.backend.products.repository;
import com.dgt.backend.products.entity.Brand;
import org.springframework.data.jpa.repository.JpaRepository;
// Spring Data supplies CRUD and pagination for the brand entity using a Long primary key.
public interface BrandRepository extends JpaRepository<Brand, Long> {}
