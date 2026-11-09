package com.dgt.backend.pricebook.repository;

import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;

/** Shared catalog. Compatibility keys keep existing records and approvals valid. */
// Read the shared active discount-type catalog through JDBC.
public final class DiscountTypes {
 private DiscountTypes() {}
 // Return promotion compatibility keys and display labels in catalog order.
 public static List<Map<String,Object>> promotions(JdbcTemplate db) {
  return db.queryForList("SELECT promotion_value AS value,name AS label FROM discount_type WHERE is_active AND promotion_value IS NOT NULL ORDER BY sort_order,discount_type_id");
 }
 // Return contract compatibility keys and display labels in catalog order.
 public static List<Map<String,Object>> contracts(JdbcTemplate db) {
  return db.queryForList("SELECT contract_value AS value,name AS label FROM discount_type WHERE is_active AND contract_value IS NOT NULL ORDER BY sort_order,discount_type_id");
 }
 // Accept only a promotion key present in the active catalog.
 public static boolean promotionAllowed(JdbcTemplate db,String value) {
  return Boolean.TRUE.equals(db.queryForObject("SELECT EXISTS(SELECT 1 FROM discount_type WHERE is_active AND promotion_value=?)",Boolean.class,value));
 }
 // Accept only a contract key present in the active catalog.
 public static boolean contractAllowed(JdbcTemplate db,String value) {
  return Boolean.TRUE.equals(db.queryForObject("SELECT EXISTS(SELECT 1 FROM discount_type WHERE is_active AND contract_value=?)",Boolean.class,value));
 }
}
