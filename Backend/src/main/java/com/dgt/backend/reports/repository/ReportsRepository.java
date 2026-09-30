package com.dgt.backend.reports.repository;

import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import com.dgt.backend.reports.entity.*;


@Repository
public class ReportsRepository {
    private final JdbcTemplate db;
    public ReportsRepository(JdbcTemplate db) { this.db=db; }
    public List<SalesSummary> sales(String store,OffsetDateTime from,OffsetDateTime to) {
        return db.query("SELECT (sale_datetime AT TIME ZONE 'UTC')::date AS sale_date,count(*) AS transactions,sum(subtotal) AS subtotal,sum(tax_amount) AS tax_amount,sum(total_amount) AS total_amount FROM public.sales WHERE store_id=? AND sale_datetime>=? AND sale_datetime<? AND sale_status='COMPLETED' AND transaction_type='SALE' GROUP BY 1 ORDER BY 1",(rs,n) -> new SalesSummary(rs.getObject("sale_date",LocalDate.class),rs.getLong("transactions"),rs.getBigDecimal("subtotal"),rs.getBigDecimal("tax_amount"),rs.getBigDecimal("total_amount")),store,from,to);
    }
    public List<InventorySnapshot> inventory(String store,int page,int size) {
        return db.query("SELECT i.inventory_id,i.dgt_id,i.product_id,p.product_name,i.available_quantity,i.cost,i.return_cost FROM public.inventory i JOIN public.products p ON p.product_id=i.product_id WHERE i.dgt_id=? ORDER BY i.inventory_id LIMIT ? OFFSET ?",(rs,n) -> new InventorySnapshot(rs.getLong("inventory_id"),rs.getString("dgt_id"),rs.getLong("product_id"),rs.getString("product_name"),rs.getBigDecimal("available_quantity"),rs.getBigDecimal("cost"),rs.getBigDecimal("return_cost")),store,size,(long)page*size);
    }
}
