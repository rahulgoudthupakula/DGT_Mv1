package com.dgt.backend.productbarcodes.repository;
import com.dgt.backend.productbarcodes.entity.ProductBarcode;
import org.springframework.data.jpa.repository.JpaRepository;
// Spring Data supplies CRUD and pagination for the product barcode entity using a Long primary key.
public interface ProductBarcodeRepository extends JpaRepository<ProductBarcode, Long> {}
