package com.dgt.backend.vendors.repository;
import com.dgt.backend.vendors.entity.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;
public interface VendorRepository extends JpaRepository<Vendor, Long> {}
