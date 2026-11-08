package com.dgt.backend.access.dto;

import java.util.*;

/** Request fields for ChildStoreController; JSON field names remain unchanged. */
public record CreateChildStoreRequest(String parentStoreId,String storeId,String storeName,String legalBusinessName,String taxId,String licenseNumber,String timezone,String address,String phone,String email){}
