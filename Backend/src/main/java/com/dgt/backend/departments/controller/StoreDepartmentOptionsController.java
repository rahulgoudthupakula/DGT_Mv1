package com.dgt.backend.departments.controller;

import java.util.*;
import com.dgt.backend.access.security.ScopedAccess;
import com.dgt.backend.access.security.PagePermissions;
import com.dgt.backend.departments.service.StoreDepartmentCatalog;
import org.springframework.web.bind.annotation.*;

/** Selector data does not require department-management access or expose management metadata. */
@RestController
@RequestMapping("/api/v1/access/stores/{store}/department-options")
public class StoreDepartmentOptionsController {
 private final ScopedAccess access;private final PagePermissions pages;private final StoreDepartmentCatalog catalog;
 public StoreDepartmentOptionsController(ScopedAccess access,PagePermissions pages,StoreDepartmentCatalog catalog){this.access=access;this.pages=pages;this.catalog=catalog;}
 @GetMapping public List<Map<String,Object>> list(@PathVariable String store){
  access.assigned(store);
  pages.requireAny(store,"PRICE_BOOK_PAGE_ITEMS","PRICE_BOOK_PAGE_NEW_ARRIVALS","PRICE_BOOK_PAGE_BULK_UPDATE",
   "PRICE_BOOK_PAGE_INVENTORY_BY_ITEM_CURRENT_STOCK","INVENTORY_VALUATION_PAGE_CURRENT_STOCK",
   "GROCERY_PAGE_INVENTORY_ADJUSTMENT","GROCERY_PAGE_INVENTORY_RETURNABLE","GROCERY_PAGE_INVENTORY_SHRINKAGE",
   "GROCERY_PAGE_PURCHASE_ORDERS_SUGGESTED","GROCERY_PAGE_PURCHASE_ORDERS_HISTORY");
  return catalog.options(store);
 }
}
