package com.dgt.backend.productbarcodes.repository;
import com.dgt.backend.productbarcodes.entity.ProductBarcode;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ProductBarcodeRepository extends JpaRepository<ProductBarcode, Long> {}
