package com.dgt.backend.vendors.repository;
import com.dgt.backend.vendors.entity.VendorPriceSetting;
import org.springframework.data.jpa.repository.JpaRepository;
// Spring Data supplies CRUD and pagination for the vendor pricing preferences entity using a Long primary key.
public interface VendorPriceSettingRepository extends JpaRepository<VendorPriceSetting, Long> {}
