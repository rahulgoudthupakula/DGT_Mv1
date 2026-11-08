package com.dgt.backend.stores.repository;
import com.dgt.backend.stores.entity.StoreContactInfo;
import org.springframework.data.jpa.repository.JpaRepository;
// Spring Data supplies CRUD and pagination for the store contact information entity using its declared primary-key type.
public interface StoreContactInfoRepository extends JpaRepository<StoreContactInfo, Long> {}
