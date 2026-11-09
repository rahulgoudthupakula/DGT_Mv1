package com.dgt.backend.stores.repository;
import com.dgt.backend.stores.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;
// Spring Data supplies CRUD and pagination for the store entity using its declared primary-key type.
public interface StoreRepository extends JpaRepository<Store, String> {}
