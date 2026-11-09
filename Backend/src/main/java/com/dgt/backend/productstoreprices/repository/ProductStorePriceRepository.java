package com.dgt.backend.productstoreprices.repository;
import com.dgt.backend.productstoreprices.entity.ProductStorePrice;
import org.springframework.data.jpa.repository.JpaRepository;
// Spring Data supplies CRUD and pagination for the product store price entity using a Long primary key.
public interface ProductStorePriceRepository extends JpaRepository<ProductStorePrice, Long> {}
